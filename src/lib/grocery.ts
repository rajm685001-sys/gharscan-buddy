import type { GroceryPriority } from "@/types/grocery";

export function getPriorityMeta(priority: GroceryPriority) {
  const priorities = {
    high: {
      label: "High",
      className:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    },
    medium: {
      label: "Medium",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
    low: {
      label: "Low",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    },
  } as const;

  return priorities[priority];
}

export function formatGroceryQuantity(
  quantity: number,
  unit: string,
) {
  const number = Number(quantity);

  return `${Number.isInteger(number) ? number : number.toFixed(2)} ${unit}`;
}