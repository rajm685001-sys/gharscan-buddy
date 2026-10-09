export type MealSlot = "breakfast" | "lunch" | "snacks" | "dinner";

export type MealStatus = "planned" | "cooked" | "skipped";

export type MealIngredient = {
  name: string;
  quantity?: string;
};

export type MealPlan = {
  id: string;
  family_id: string;
  meal_date: string;
  meal_slot: MealSlot;
  recipe_name: string;
  servings: number;
  preparation_minutes: number | null;
  dietary_tag: string | null;
  ingredients: MealIngredient[];
  notes: string | null;
  status: MealStatus;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};