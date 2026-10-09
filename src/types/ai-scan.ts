import type {
  InventoryCategory,
  InventoryUnit,
  StorageLocation,
} from "@/types/inventory";

export type AiScanResult = {
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
  barcode: string;
  batchNumber: string;
  manufactureDate: string;
  confidence: number;
  detectedText: string[];
  warnings: string[];
};