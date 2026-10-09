export type InventoryCategory =
  | "food"
  | "pantry"
  | "fresh_food"
  | "beverages"
  | "medicine"
  | "toiletries"
  | "cleaning"
  | "stationery"
  | "kitchen_supplies"
  | "electronics"
  | "baby_care"
  | "pet_supplies"
  | "other";

export type StorageLocation =
  | "pantry"
  | "fridge"
  | "freezer"
  | "medicine_box"
  | "bathroom"
  | "cleaning_shelf"
  | "bedroom"
  | "garage"
  | "pooja"
  | "other";

export type InventoryUnit =
  | "piece"
  | "packet"
  | "box"
  | "bottle"
  | "can"
  | "jar"
  | "tube"
  | "strip"
  | "kg"
  | "g"
  | "litre"
  | "ml";

export type InventoryItem = {
  id: string;
  family_id: string;
  name: string;
  brand: string | null;
  category: InventoryCategory;
  storage_location: StorageLocation;
  quantity: number;
  unit: InventoryUnit;
  minimum_quantity: number;
  purchase_date: string | null;
  expiry_date: string | null;
  price: number | null;
  image_path: string | null;
  notes: string | null;
  is_finished: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type InventoryStatus =
  | "expired"
  | "expiring_soon"
  | "low_stock"
  | "finished"
  | "available";