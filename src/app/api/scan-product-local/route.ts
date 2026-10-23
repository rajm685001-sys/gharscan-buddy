import { NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type LocalScanResult = {
  name: string;
  brand: string;
  category: string;
  storageLocation: string;
  quantity: string;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  price: string;
  notes: string;
  barcode: string;
  batchNumber: string;
  manufactureDate: string;
  confidence: number;
  detectedText: string[];
  warnings: string[];
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDate(value: unknown) {
  const valueAsString = cleanString(value);

  return /^\d{4}-\d{2}-\d{2}$/.test(valueAsString) ? valueAsString : "";
}

function cleanConfidence(value: unknown) {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

function normalizeResult(parsed: Record<string, unknown>): LocalScanResult {
  const detectedText = Array.isArray(parsed.detectedText)
    ? parsed.detectedText
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

  const warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];

  return {
    name: cleanString(parsed.name) || "Scanned Home Item",
    brand: cleanString(parsed.brand),
    category: cleanString(parsed.category) || "other",
    storageLocation: cleanString(parsed.storageLocation) || "other",
    quantity: cleanString(parsed.quantity) || "1",
    unit: cleanString(parsed.unit) || "piece",
    purchaseDate:
      cleanDate(parsed.purchaseDate) ||
      new Date().toISOString().split("T")[0],
    expiryDate: cleanDate(parsed.expiryDate),
    price: cleanString(parsed.price),
    notes: cleanString(parsed.notes),
    barcode: cleanString(parsed.barcode),
    batchNumber: cleanString(parsed.batchNumber),
    manufactureDate: cleanDate(parsed.manufactureDate),
    confidence: cleanConfidence(parsed.confidence),
    detectedText,
    warnings,
  };
}

function extractJson(rawText: string) {
  const jsonStart = rawText.indexOf("{");
  const jsonEnd = rawText.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("Ollama did not return valid JSON.");
  }

  return JSON.parse(
    rawText.slice(jsonStart, jsonEnd + 1),
  ) as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const ollamaApiUrl =
      process.env.OLLAMA_API_URL ?? "http://localhost:11434/api/chat";

    const formData = await request.formData();
    const image = formData.get("image");
    const barcode = cleanString(formData.get("barcode"));

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          error: "A product image is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(image.type)) {
      return NextResponse.json(
        {
          error: "Use a JPG, PNG, or WebP image.",
        },
        {
          status: 400,
        },
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Image must be smaller than 5 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const imageBase64 = Buffer.from(await image.arrayBuffer()).toString(
      "base64",
    );

    const prompt = `Extract product details from this product label image.

Return ONLY valid JSON. Do not add explanations, markdown, or extra text.

Use this exact JSON structure:
{
  "name": "",
  "brand": "",
  "category": "",
  "storageLocation": "",
  "quantity": "",
  "unit": "",
  "purchaseDate": "",
  "expiryDate": "",
  "price": "",
  "notes": "",
  "barcode": "",
  "batchNumber": "",
  "manufactureDate": "",
  "confidence": 0,
  "detectedText": [],
  "warnings": []
}

Rules:
- Use empty strings for details that are not visible.
- Use YYYY-MM-DD format for dates.
- category must be one of: pantry, refrigerator, freezer, bathroom, cleaning, medicine, other.
- storageLocation must be one of: kitchen, pantry, refrigerator, freezer, bathroom, bedroom, living-room, storage, other.
- unit must be one of: piece, kg, g, l, ml, pack, bottle, box.
- confidence must be an integer from 0 to 100.
- Do not invent product details.
- If a barcode is provided, include it in the barcode field.
${barcode ? `- Provided barcode: ${barcode}` : ""}`;

    const response = await fetch(ollamaApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen2.5vl:7b",
        stream: false,
        options: {
          num_ctx: 8192,
          temperature: 0.1,
        },
        messages: [
          {
            role: "user",
            content: prompt,
            images: [imageBase64],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Ollama scan failed:", response.status, errorText);

      return NextResponse.json(
        {
          error:
            "Local Ollama scan failed. Ensure Ollama is running and qwen2.5vl:7b is installed.",
        },
        {
          status: 502,
        },
      );
    }

    const data = (await response.json()) as {
      message?: {
        content?: string;
      };
    };

    const rawText = data.message?.content?.trim() ?? "";

    if (!rawText) {
      return NextResponse.json(
        {
          error: "Ollama did not return extraction data.",
        },
        {
          status: 422,
        },
      );
    }

    let parsedJson: Record<string, unknown>;

    try {
      parsedJson = extractJson(rawText);
    } catch {
      return NextResponse.json(
        {
          error: "Ollama returned an unreadable result. Please try again.",
        },
        {
          status: 422,
        },
      );
    }

    return NextResponse.json({
      result: normalizeResult(parsedJson),
      provider: "ollama",
    });
  } catch (error) {
    console.error("Local Ollama scan error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to scan using local Ollama. Ensure Ollama is running on this computer.",
      },
      {
        status: 500,
      },
    );
  }
}