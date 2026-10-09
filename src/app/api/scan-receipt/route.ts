import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import type { ReceiptDraftItem } from "@/types/receipt";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const categories = [
  "food",
  "pantry",
  "fresh_food",
  "beverages",
  "medicine",
  "toiletries",
  "cleaning",
  "stationery",
  "kitchen_supplies",
  "electronics",
  "baby_care",
  "pet_supplies",
  "other",
] as const;

const locations = [
  "pantry",
  "fridge",
  "freezer",
  "medicine_box",
  "bathroom",
  "cleaning_shelf",
  "bedroom",
  "garage",
  "pooja",
  "other",
] as const;

const units = [
  "piece",
  "packet",
  "box",
  "bottle",
  "can",
  "jar",
  "tube",
  "strip",
  "kg",
  "g",
  "litre",
  "ml",
] as const;

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDate(value: unknown) {
  const valueAsString = cleanString(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(valueAsString)) {
    return valueAsString;
  }

  return "";
}

function cleanMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1_000_000, value)).toFixed(2);
  }

  const cleaned = cleanString(value)
    .replace(/[₹,$,\s]/g, "")
    .replace(/,/g, "");

  if (!cleaned) {
    return "";
  }

  const number = Number(cleaned);

  if (!Number.isFinite(number)) {
    return "";
  }

  return Math.max(0, Math.min(1_000_000, number)).toFixed(2);
}

function cleanQuantity(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.max(0, Math.min(1_000_000, value)));
  }

  const valueAsString = cleanString(value);

  if (!valueAsString) {
    return "1";
  }

  const number = Number(valueAsString);

  if (!Number.isFinite(number)) {
    return "1";
  }

  return String(Math.max(0, Math.min(1_000_000, number)));
}

function cleanConfidence(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(number)));
}

function cleanWarnings(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function todayAsDateInput() {
  return new Date().toISOString().split("T")[0];
}

function normalizeItem(
  value: unknown,
  index: number,
): ReceiptDraftItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const name = cleanString(item.name);

  if (!name) {
    return null;
  }

  const category = cleanString(item.category);
  const storageLocation = cleanString(item.storageLocation);
  const unit = cleanString(item.unit);

  return {
    id: `receipt-item-${index + 1}-${crypto.randomUUID()}`,
    lineNumber: index + 1,
    selected: item.includeByDefault !== false,
    name: name.slice(0, 200),
    brand: cleanString(item.brand).slice(0, 120),
    category: categories.includes(
      category as (typeof categories)[number],
    )
      ? (category as ReceiptDraftItem["category"])
      : "other",
    storageLocation: locations.includes(
      storageLocation as (typeof locations)[number],
    )
      ? (storageLocation as ReceiptDraftItem["storageLocation"])
      : "other",
    quantity: cleanQuantity(item.quantity),
    unit: units.includes(unit as (typeof units)[number])
      ? (unit as ReceiptDraftItem["unit"])
      : "piece",
    price: cleanMoney(item.lineTotal ?? item.unitPrice),
    expiryDate: cleanDate(item.expiryDate),
    notes: cleanString(item.notes).slice(0, 500),
    confidence: cleanConfidence(item.confidence),
    warnings: cleanWarnings(item.warnings),
  };
}

function normalizeResult(parsed: Record<string, unknown>) {
  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];

  const items = rawItems
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is ReceiptDraftItem => item !== null)
    .slice(0, 50);

  return {
    storeName: cleanString(parsed.storeName).slice(0, 160),
    purchaseDate: cleanDate(parsed.purchaseDate) || todayAsDateInput(),
    receiptTotal: cleanMoney(parsed.receiptTotal),
    currency: "INR" as const,
    items,
    warnings: cleanWarnings(parsed.warnings),
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini is not configured. Add GEMINI_API_KEY and restart the server.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "A receipt image is required." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, or WebP receipt image." },
        { status: 400 },
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Receipt image must be smaller than 8 MB." },
        { status: 400 },
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageBase64 = imageBuffer.toString("base64");

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are GharScan Buddy's receipt extraction assistant.

Analyze one grocery or household shopping receipt image.
Return ONLY valid JSON matching the provided response schema.

Important rules:
- Extract product line items only.
- Do not create items for tax, GST, VAT, discounts, coupons, loyalty points,
  subtotals, receipt totals, payment methods, change, bags, delivery fees,
  store addresses, cashier lines, or receipt metadata.
- Do not invent a product name or price.
- Ignore unreadable lines rather than guessing.
- Preserve product brand when visible.
- Use quantity 1 when the line clearly represents one item but quantity is not shown.
- If a line includes a count such as "2 x 500 ml", use quantity 2 and unit "bottle"
  when appropriate, and explain the interpretation in notes.
- Dates must be YYYY-MM-DD.
- If the receipt date is not visible, return an empty purchaseDate.
- receiptTotal should be the final receipt total only, not a subtotal.
- Use only the allowed category, storage location, and unit values.
- includeByDefault must be false for uncertain lines, non-product lines,
  or lines that look like duplicates.
- Keep warnings short and specific.

Allowed categories:
${categories.join(", ")}

Allowed storage locations:
${locations.join(", ")}

Allowed units:
${units.join(", ")}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: image.type,
                data: imageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            storeName: { type: "string" },
            purchaseDate: { type: "string" },
            receiptTotal: { type: "string" },
            currency: {
              type: "string",
              enum: ["INR"],
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  brand: { type: "string" },
                  category: {
                    type: "string",
                    enum: categories,
                  },
                  storageLocation: {
                    type: "string",
                    enum: locations,
                  },
                  quantity: { type: "number" },
                  unit: {
                    type: "string",
                    enum: units,
                  },
                  unitPrice: { type: "number" },
                  lineTotal: { type: "number" },
                  expiryDate: { type: "string" },
                  notes: { type: "string" },
                  confidence: { type: "number" },
                  includeByDefault: { type: "boolean" },
                  warnings: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "name",
                  "brand",
                  "category",
                  "storageLocation",
                  "quantity",
                  "unit",
                  "unitPrice",
                  "lineTotal",
                  "expiryDate",
                  "notes",
                  "confidence",
                  "includeByDefault",
                  "warnings",
                ],
              },
            },
            warnings: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "storeName",
            "purchaseDate",
            "receiptTotal",
            "currency",
            "items",
            "warnings",
          ],
        },
      },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      return NextResponse.json(
        {
          error:
            "Gemini did not return receipt data. Try a brighter, flatter receipt image.",
        },
        { status: 422 },
      );
    }

    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        {
          error:
            "Gemini returned an unreadable receipt result. Try the receipt again.",
        },
        { status: 422 },
      );
    }

    const result = normalizeResult(parsed);

    if (result.items.length === 0) {
      return NextResponse.json(
        {
          error:
            "No product lines were detected. Make sure the receipt is flat, bright, and readable.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Gemini receipt scan failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });

    return NextResponse.json(
      {
        error:
          "Unable to read this receipt. Try a clearer image and submit it again.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}