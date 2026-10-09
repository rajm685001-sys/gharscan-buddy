import type {
  InventoryCategory,
  InventoryUnit,
  StorageLocation,
} from "@/types/inventory";

export type ReceiptDraftItem = {
  id: string;
  lineNumber: number;
  selected: boolean;
  name: string;
  brand: string;
  category: InventoryCategory;
  storageLocation: StorageLocation;
  quantity: string;
  unit: InventoryUnit;
  price: string;
  expiryDate: string;
  notes: string;
  confidence: number;
  warnings: string[];
};

export type ReceiptScanResult = {
  storeName: string;
  purchaseDate: string;
  receiptTotal: string;
  currency: "INR";
  items: ReceiptDraftItem[];
  warnings: string[];
};