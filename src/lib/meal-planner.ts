import type {
  MealIngredient,
  MealPlan,
  MealSlot,
  MealStatus,
} from "@/types/meal";
import type { InventoryItem } from "@/types/inventory";

export const mealSlots: Array<{
  value: MealSlot;
  label: string;
  emoji: string;
}> = [
  { value: "breakfast", label: "Breakfast", emoji: "🌤️" },
  { value: "lunch", label: "Lunch", emoji: "☀️" },
  { value: "snacks", label: "Snacks", emoji: "☕" },
  { value: "dinner", label: "Dinner", emoji: "🌙" },
];

export function getMealSlotMeta(slot: MealSlot) {
  return (
    mealSlots.find((mealSlot) => mealSlot.value === slot) ??
    mealSlots[0]
  );
}

export function getMealStatusMeta(status: MealStatus) {
  const statuses = {
    planned: {
      label: "Planned",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    },
    cooked: {
      label: "Cooked",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
    skipped: {
      label: "Skipped",
      className:
        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
  } as const;

  return statuses[status];
}

export function getStartOfWeek(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;

  current.setDate(current.getDate() + distanceToMonday);
  current.setHours(0, 0, 0, 0);

  return current;
}

export function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekDays(startDate: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      dateKey: formatDateInput(date),
      shortDay: new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
      }).format(date),
      dayNumber: new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
      }).format(date),
      fullDate: new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(date),
    };
  });
}

export function formatMealDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function getIngredientAvailability(
  ingredients: MealIngredient[],
  inventoryItems: InventoryItem[],
) {
  const normalizedInventory = inventoryItems
    .filter((item) => !item.is_finished && Number(item.quantity) > 0)
    .map((item) => item.name.toLowerCase());

  const available: MealIngredient[] = [];
  const missing: MealIngredient[] = [];

  for (const ingredient of ingredients) {
    const ingredientName = ingredient.name.trim().toLowerCase();

    if (!ingredientName) {
      continue;
    }

    const exists = normalizedInventory.some(
      (inventoryName) =>
        inventoryName.includes(ingredientName) ||
        ingredientName.includes(inventoryName),
    );

    if (exists) {
      available.push(ingredient);
    } else {
      missing.push(ingredient);
    }
  }

  return { available, missing };
}

export function parseIngredients(input: string): MealIngredient[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, ...quantityParts] = item.split(":");

      return {
        name: name.trim(),
        quantity: quantityParts.join(":").trim() || undefined,
      };
    });
}

export function ingredientListToInput(ingredients: MealIngredient[]) {
  return ingredients
    .map((ingredient) =>
      ingredient.quantity
        ? `${ingredient.name}: ${ingredient.quantity}`
        : ingredient.name,
    )
    .join(", ");
}

export function mealPlanKey(mealDate: string, mealSlot: MealSlot) {
  return `${mealDate}-${mealSlot}`;
}

export function isToday(dateKey: string) {
  return formatDateInput(new Date()) === dateKey;
}

export function isSameWeekPlan(
  mealPlan: MealPlan,
  weekDays: Array<{ dateKey: string }>,
) {
  return weekDays.some((day) => day.dateKey === mealPlan.meal_date);
}