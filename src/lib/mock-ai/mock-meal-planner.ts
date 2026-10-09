import { getInventoryStatus } from "@/lib/inventory";
import type { InventoryItem } from "@/types/inventory";

export type MealPlannerPreferences = {
  mealType: "breakfast" | "lunch" | "snacks" | "dinner";
  servings: number;
  maxCookingMinutes: number;
  dietaryPreference: string;
};

export type AiMealSuggestion = {
  id: string;
  title: string;
  description: string;
  mealType: "breakfast" | "lunch" | "snacks" | "dinner";
  preparationMinutes: number;
  servings: number;
  dietaryTag: string;
  ingredients: Array<{
    name: string;
    quantity: string;
  }>;
  availableIngredients: string[];
  missingIngredients: string[];
  expiringIngredientsUsed: string[];
  steps: string[];
  reason: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function hasIngredient(items: InventoryItem[], keywords: string[]) {
  return items.some((item) =>
    keywords.some((keyword) =>
      normalize(item.name).includes(normalize(keyword)),
    ),
  );
}

function getAvailableInventoryItems(items: InventoryItem[]) {
  return items.filter(
    (item) =>
      !item.is_finished &&
      Number(item.quantity) > 0 &&
      getInventoryStatus(item) !== "expired",
  );
}

function getExpiringItems(items: InventoryItem[]) {
  return items.filter(
    (item) => getInventoryStatus(item) === "expiring_soon",
  );
}

function ingredientAvailability(
  ingredients: Array<{ name: string; quantity: string }>,
  items: InventoryItem[],
) {
  const availableItems = getAvailableInventoryItems(items);
  const availableIngredients: string[] = [];
  const missingIngredients: string[] = [];

  for (const ingredient of ingredients) {
    const ingredientName = normalize(ingredient.name);

    const exists = availableItems.some((item) => {
      const itemName = normalize(item.name);

      return (
        itemName.includes(ingredientName) ||
        ingredientName.includes(itemName)
      );
    });

    if (exists) {
      availableIngredients.push(ingredient.name);
    } else {
      missingIngredients.push(ingredient.name);
    }
  }

  return {
    availableIngredients,
    missingIngredients,
  };
}

function createSuggestion(
  id: string,
  title: string,
  description: string,
  preferences: MealPlannerPreferences,
  ingredients: Array<{ name: string; quantity: string }>,
  steps: string[],
  reason: string,
  inventoryItems: InventoryItem[],
  expiringKeywords: string[],
): AiMealSuggestion {
  const availability = ingredientAvailability(ingredients, inventoryItems);

  const expiringIngredientsUsed = getExpiringItems(inventoryItems)
    .filter((item) =>
      expiringKeywords.some((keyword) =>
        normalize(item.name).includes(normalize(keyword)),
      ),
    )
    .map((item) => item.name);

  return {
    id,
    title,
    description,
    mealType: preferences.mealType,
    preparationMinutes: Math.min(
      preferences.maxCookingMinutes,
      preferences.maxCookingMinutes <= 20 ? 20 : 30,
    ),
    servings: preferences.servings,
    dietaryTag: preferences.dietaryPreference || "Home-style",
    ingredients,
    availableIngredients: availability.availableIngredients,
    missingIngredients: availability.missingIngredients,
    expiringIngredientsUsed,
    steps,
    reason,
  };
}

export async function generateMockMealSuggestions(
  inventoryItems: InventoryItem[],
  preferences: MealPlannerPreferences,
): Promise<AiMealSuggestion[]> {
  await new Promise((resolve) => setTimeout(resolve, 2200));

  const availableItems = getAvailableInventoryItems(inventoryItems);
  const expiringItems = getExpiringItems(inventoryItems);

  const hasPaneer = hasIngredient(availableItems, ["paneer"]);
  const hasSpinach = hasIngredient(availableItems, ["spinach", "palak"]);
  const hasRice = hasIngredient(availableItems, ["rice"]);
  const hasMilk = hasIngredient(availableItems, ["milk"]);
  const hasEgg = hasIngredient(availableItems, ["egg"]);
  const hasTomato = hasIngredient(availableItems, ["tomato"]);
  const hasOnion = hasIngredient(availableItems, ["onion"]);
  const hasBread = hasIngredient(availableItems, ["bread"]);
  const hasDal = hasIngredient(availableItems, ["dal", "lentil"]);
  const hasPotato = hasIngredient(availableItems, ["potato", "aloo"]);

  const suggestions: AiMealSuggestion[] = [];

  if (
    preferences.mealType === "dinner" ||
    preferences.mealType === "lunch"
  ) {
    if (hasPaneer || hasSpinach) {
      suggestions.push(
        createSuggestion(
          "palak-paneer-rice",
          "Palak Paneer with Jeera Rice",
          "A quick, comforting Indian meal designed to use paneer and spinach before they expire.",
          preferences,
          [
            { name: "Paneer", quantity: "250 g" },
            { name: "Spinach", quantity: "2 bunches" },
            { name: "Rice", quantity: "2 cups" },
            { name: "Onion", quantity: "1" },
            { name: "Tomato", quantity: "2" },
          ],
          [
            "Wash and blanch spinach for two minutes, then blend into a smooth puree.",
            "Sauté onion and tomato with basic spices until soft.",
            "Add spinach puree and paneer cubes, then simmer for five minutes.",
            "Prepare jeera rice and serve hot with paneer.",
          ],
          "Uses ingredients already available at home and prioritizes paneer or spinach that may be nearing expiry.",
          inventoryItems,
          ["paneer", "spinach", "palak"],
        ),
      );
    }

    if (hasDal || hasRice || hasTomato) {
      suggestions.push(
        createSuggestion(
          "dal-rice-bowl",
          "Tomato Dal Rice Bowl",
          "A simple one-pot meal using pantry basics for a quick family lunch or dinner.",
          preferences,
          [
            { name: "Dal", quantity: "1 cup" },
            { name: "Rice", quantity: "2 cups" },
            { name: "Tomato", quantity: "2" },
            { name: "Onion", quantity: "1" },
            { name: "Coriander", quantity: "small handful" },
          ],
          [
            "Pressure cook dal with tomato, turmeric, and salt.",
            "Prepare rice separately or use leftover rice.",
            "Temper onion, cumin, and spices in a pan.",
            "Mix the tempering into dal and serve with rice.",
          ],
          "Uses long-lasting pantry ingredients, reduces extra shopping, and can be prepared quickly.",
          inventoryItems,
          ["tomato", "dal", "rice"],
        ),
      );
    }

    if (hasPotato || hasOnion || hasTomato) {
      suggestions.push(
        createSuggestion(
          "vegetable-poha",
          "Vegetable Poha",
          "A light, fast meal that can use vegetables, onions, potatoes, and pantry staples.",
          preferences,
          [
            { name: "Poha", quantity: "2 cups" },
            { name: "Potato", quantity: "1" },
            { name: "Onion", quantity: "1" },
            { name: "Tomato", quantity: "1" },
            { name: "Lemon", quantity: "1" },
          ],
          [
            "Rinse poha briefly and let it rest.",
            "Sauté onion, potato, and tomato with mustard seeds and curry leaves.",
            "Add poha, salt, turmeric, and mix gently.",
            "Finish with lemon juice and coriander.",
          ],
          "A flexible recipe that makes good use of common home inventory items.",
          inventoryItems,
          ["potato", "onion", "tomato"],
        ),
      );
    }
  }

  if (preferences.mealType === "breakfast") {
    if (hasEgg || hasBread) {
      suggestions.push(
        createSuggestion(
          "egg-bread-breakfast",
          "Masala Egg and Toast",
          "A high-protein breakfast using eggs, bread, and simple vegetables.",
          preferences,
          [
            { name: "Egg", quantity: "4" },
            { name: "Bread", quantity: "4 slices" },
            { name: "Onion", quantity: "1" },
            { name: "Tomato", quantity: "1" },
          ],
          [
            "Chop onion and tomato finely.",
            "Whisk eggs with salt and spices.",
            "Cook the egg mixture with vegetables in a pan.",
            "Toast bread and serve with masala egg.",
          ],
          "Uses quick-cooking ingredients and helps use eggs or bread before they go stale.",
          inventoryItems,
          ["egg", "bread", "tomato"],
        ),
      );
    }

    if (hasMilk) {
      suggestions.push(
        createSuggestion(
          "milk-oats-breakfast",
          "Milk Oats Fruit Bowl",
          "A quick breakfast that uses milk and pantry staples with optional fruit toppings.",
          preferences,
          [
            { name: "Milk", quantity: "2 cups" },
            { name: "Oats", quantity: "1.5 cups" },
            { name: "Banana", quantity: "2" },
            { name: "Nuts", quantity: "small handful" },
          ],
          [
            "Warm milk in a saucepan.",
            "Add oats and cook until soft.",
            "Slice banana and add it with nuts.",
            "Serve warm or chill for later.",
          ],
          "Uses milk before expiry and creates a filling breakfast in very little time.",
          inventoryItems,
          ["milk"],
        ),
      );
    }
  }

  if (preferences.mealType === "snacks") {
    suggestions.push(
      createSuggestion(
        "quick-vegetable-sandwich",
        "Quick Vegetable Sandwich",
        "A flexible snack that uses bread and any available vegetables.",
        preferences,
        [
          { name: "Bread", quantity: "4 slices" },
          { name: "Tomato", quantity: "1" },
          { name: "Onion", quantity: "1" },
          { name: "Potato", quantity: "1" },
          { name: "Butter", quantity: "2 tsp" },
        ],
        [
          "Prepare thin slices of vegetables.",
          "Season vegetables with salt, pepper, and herbs.",
          "Fill bread slices and toast until golden.",
          "Serve with chutney or ketchup.",
        ],
        "A snack suggestion that adapts well to vegetables you already have at home.",
        inventoryItems,
        ["bread", "tomato", "onion", "potato"],
      ),
    );
  }

  if (suggestions.length === 0) {
    const priorityNames = expiringItems
      .slice(0, 3)
      .map((item) => item.name);

    suggestions.push(
      createSuggestion(
        "inventory-cleanup-meal",
        "Flexible Home Pantry Bowl",
        "A customizable meal idea based on pantry items and ingredients that need to be used soon.",
        preferences,
        [
          { name: "Rice or Roti", quantity: "as needed" },
          { name: "Available vegetables", quantity: "2 cups" },
          { name: "Protein item", quantity: "1 serving" },
          { name: "Basic spices", quantity: "as needed" },
        ],
        [
          "Choose vegetables or ingredients that are close to expiry.",
          "Prepare a simple stir-fry, curry, or mixed bowl using available spices.",
          "Serve with rice or roti.",
          "Add missing ingredients to the grocery list only if essential.",
        ],
        priorityNames.length > 0
          ? `Prioritizes expiring items: ${priorityNames.join(", ")}.`
          : "Uses flexible pantry ingredients while reducing food waste.",
        inventoryItems,
        priorityNames,
      ),
    );
  }

  return suggestions.slice(0, 3);
}