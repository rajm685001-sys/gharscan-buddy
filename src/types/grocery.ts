import type {
  InventoryCategory,
  InventoryUnit,
} from "@/types/inventory";

export type GroceryPriority = "low" | "medium" | "high";

export type GroceryStatus = "pending" | "purchased";

export type GroceryItem = {
  id: string;
  family_id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: InventoryUnit;
  priority: GroceryPriority;
  status: GroceryStatus;
  notes: string | null;
  source_inventory_item_id: string | null;
  created_by: string;
  purchased_by: string | null;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
};