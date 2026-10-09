import type {
  InventoryCategory,
  InventoryUnit,
  StorageLocation,
} from "@/types/inventory";

export type MockScanResult = {
  name: string;
  brand: string;
  category: InventoryCategory;
  storageLocation: StorageLocation;
  quantity: string;
  unit: InventoryUnit;
  purchaseDate: string;
  expiryDate: string;
  price: string;
  notes: string;
  confidence: number;
  detectedText: string[];
};

function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

export async function mockScanProduct(
  fileName: string,
): Promise<MockScanResult> {
  await new Promise((resolve) => setTimeout(resolve, 2200));

  const normalizedName = fileName.toLowerCase();

  const today = new Date();
  const purchaseDate = toDateInputValue(today);

  const expiryDate = new Date();
  expiryDate.setDate(today.getDate() + 5);

  if (
    normalizedName.includes("milk") ||
    normalizedName.includes("dairy") ||
    normalizedName.includes("amul")
  ) {
    return {
      name: "Amul Taaza Milk",
      brand: "Amul",
      category: "food",
      storageLocation: "fridge",
      quantity: "1",
      unit: "litre",
      purchaseDate,
      expiryDate: toDateInputValue(expiryDate),
      price: "64",
      notes: "Mock scan: Refrigerate after purchase. Use within the printed expiry date.",
      confidence: 94,
      detectedText: [
        "AMUL TAAZA",
        "Toned Milk",
        "Net Quantity: 1 Litre",
        "MRP: ₹64.00",
        "Keep Refrigerated",
      ],
    };
  }

  if (
    normalizedName.includes("medicine") ||
    normalizedName.includes("tablet") ||
    normalizedName.includes("paracetamol") ||
    normalizedName.includes("dolo")
  ) {
    const medicineExpiry = new Date();
    medicineExpiry.setMonth(medicineExpiry.getMonth() + 8);

    return {
      name: "Paracetamol Tablets",
      brand: "Generic Pharma",
      category: "medicine",
      storageLocation: "medicine_box",
      quantity: "1",
      unit: "strip",
      purchaseDate,
      expiryDate: toDateInputValue(medicineExpiry),
      price: "28",
      notes:
        "Mock scan: Verify dosage, batch number, and expiry date on the medicine package before use.",
      confidence: 90,
      detectedText: [
        "PARACETAMOL TABLETS",
        "10 Tablets",
        "Batch No: DEMO-1024",
        "Expiry: Verify on pack",
      ],
    };
  }

  if (
    normalizedName.includes("soap") ||
    normalizedName.includes("toothpaste") ||
    normalizedName.includes("shampoo") ||
    normalizedName.includes("toiletry")
  ) {
    const toiletriesExpiry = new Date();
    toiletriesExpiry.setMonth(toiletriesExpiry.getMonth() + 18);

    return {
      name: "Daily Care Shampoo",
      brand: "Home Essentials",
      category: "toiletries",
      storageLocation: "bathroom",
      quantity: "1",
      unit: "bottle",
      purchaseDate,
      expiryDate: toDateInputValue(toiletriesExpiry),
      price: "180",
      notes: "Mock scan: Store in a cool, dry bathroom cabinet.",
      confidence: 88,
      detectedText: [
        "DAILY CARE SHAMPOO",
        "Net Volume: 340 ml",
        "For external use only",
        "Best before: Verify on pack",
      ],
    };
  }

  return {
    name: "Scanned Home Item",
    brand: "Brand not detected",
    category: "other",
    storageLocation: "other",
    quantity: "1",
    unit: "piece",
    purchaseDate,
    expiryDate: "",
    price: "",
    notes:
      "Mock scan result. Please review the details and update any information before saving.",
    confidence: 76,
    detectedText: [
      "Product label detected",
      "Text extraction completed",
      "Some details require user review",
    ],
  };
}