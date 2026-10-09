import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

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
];

const locations = [
  "pantry",
  "fridge",
  "freezer",
  "medicine_box",
  "bathroom",
  "cleaning_shelf",
  "bedroom",
  "garage",
  "other",
];

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
];

function todayAsDateInput() {
  return new Date().toISOString().split("T")[0];
}

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

function cleanNumber(value: unknown) {
  const number = Number(value);

  if (Number.isFinite(number)) {
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  return 0;
}

function normalizeResult(parsed: Record<string, unknown>, barcode: string) {
  const category = cleanString(parsed.category);
  const storageLocation = cleanString(parsed.storageLocation);
  const unit = cleanString(parsed.unit);

  return {
    name: cleanString(parsed.name) || "Scanned Home Item",
    brand: cleanString(parsed.brand),
    category: categories.includes(category) ? category : "other",
    storageLocation: locations.includes(storageLocation)
      ? storageLocation
      : "other",
    quantity: cleanString(parsed.quantity) || "1",
    unit: units.includes(unit) ? unit : "piece",
    purchaseDate: todayAsDateInput(),
    expiryDate: cleanDate(parsed.expiryDate),
    price: cleanString(parsed.price),
    notes: cleanString(parsed.notes),
    barcode: cleanString(parsed.barcode) || barcode,
    batchNumber: cleanString(parsed.batchNumber),
    manufactureDate: cleanDate(parsed.manufactureDate),
    confidence: cleanNumber(parsed.confidence),
    detectedText: Array.isArray(parsed.detectedText)
      ? parsed.detectedText
          .filter((item): item is string => typeof item === "string")
          .slice(0, 20)
      : [],
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings
          .filter((item): item is string => typeof item === "string")
          .slice(0, 10)
      : [],
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini is not configured. Add GEMINI_API_KEY to .env.local and restart the server.",
        },
        { status: 500 },
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");
    const barcodeValue = cleanString(formData.get("barcode"));

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "A product image is required." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, or WebP image." },
        { status: 400 },
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB." },
        { status: 400 },
      );
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageBase64 = imageBuffer.toString("base64");

    const ai = new GoogleGenAI({
      apiKey,
    });

    const prompt = `
You are GharScan Buddy's product-label extraction assistant.

Analyze ONE clear product package, household item label, medicine box, or grocery item photo.
Return ONLY valid JSON matching the provided response schema.

Important extraction rules:
- Do not invent details. Use empty strings when uncertain or not visible.
- Dates MUST use YYYY-MM-DD only. Convert visible dates when possible.
- For relative wording such as "best before 6 months from packing", leave expiryDate empty and add a warning.
- Extract expiry date, manufacture date, batch number, MRP/price, net quantity, brand, and visible barcode where present.
- If a barcode is supplied by the browser, preserve it unless the visible image has a clearer barcode.
- Map the product to exactly one category and one storage location.
- Use the approved unit values only.
- detectedText should contain important visible text lines.
- confidence is 0 to 100 and should reflect how clear the label is.
- warnings should identify uncertain fields or safety notes. Medicine warnings must remind the user to verify expiry and dosage manually.

Browser-detected barcode: ${barcodeValue || "Not detected"}

Allowed categories:
${categories.join(", ")}

Allowed storage locations:
${locations.join(", ")}

Allowed units:
${units.join(", ")}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
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
            quantity: { type: "string" },
            unit: {
              type: "string",
              enum: units,
            },
            expiryDate: { type: "string" },
            price: { type: "string" },
            notes: { type: "string" },
            barcode: { type: "string" },
            batchNumber: { type: "string" },
            manufactureDate: { type: "string" },
            confidence: { type: "number" },
            detectedText: {
              type: "array",
              items: { type: "string" },
            },
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
            "expiryDate",
            "price",
            "notes",
            "barcode",
            "batchNumber",
            "manufactureDate",
            "confidence",
            "detectedText",
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
            "Gemini did not return extraction data. Try a brighter and closer product image.",
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
            "Gemini returned an unreadable result. Try scanning the product label again.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      result: normalizeResult(parsed, barcodeValue),
    });
  } catch (error) {
    console.error("Gemini product scan error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to analyze this product image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}