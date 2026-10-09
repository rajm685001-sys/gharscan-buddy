import type {
  InventoryCategory,
  InventoryItem,
  InventoryStatus,
  InventoryUnit,
  StorageLocation,
} from "@/types/inventory";

export const categoryOptions: Array<{
  value: InventoryCategory;
  label: string;
  emoji: string;
  description: string;
  group: "Food" | "Home essentials" | "Other";
}> = [
  {
    value: "pantry",
    label: "Pantry & groceries",
    emoji: "🥫",
    description: "Rice, atta, dal, oil, spices, snacks, packaged foods",
    group: "Food",
  },
  {
    value: "fresh_food",
    label: "Fresh food & dairy",
    emoji: "🥛",
    description: "Milk, eggs, paneer, curd, fruits, vegetables, meat",
    group: "Food",
  },
  {
    value: "beverages",
    label: "Beverages",
    emoji: "☕",
    description: "Tea, coffee, juice, soft drinks, drinking mixes",
    group: "Food",
  },
  {
    value: "food",
    label: "General food",
    emoji: "🍽️",
    description: "Food items not yet sorted into a specific food category",
    group: "Food",
  },
  {
    value: "medicine",
    label: "Medicines & first aid",
    emoji: "💊",
    description: "Tablets, syrups, bandages, vitamins, health supplies",
    group: "Home essentials",
  },
  {
    value: "toiletries",
    label: "Toiletries & personal care",
    emoji: "🧴",
    description: "Soap, toothpaste, shampoo, skincare, grooming",
    group: "Home essentials",
  },
  {
    value: "cleaning",
    label: "Cleaning & laundry",
    emoji: "🧹",
    description: "Detergent, dishwash, floor cleaner, disinfectant",
    group: "Home essentials",
  },
  {
    value: "stationery",
    label: "Stationery & office",
    emoji: "🖊️",
    description: "Pens, notebooks, printer paper, markers, files",
    group: "Home essentials",
  },
  {
    value: "kitchen_supplies",
    label: "Kitchen supplies",
    emoji: "🍳",
    description: "Foil, tissues, storage bags, containers, garbage bags",
    group: "Home essentials",
  },
  {
    value: "electronics",
    label: "Electronics & batteries",
    emoji: "🔋",
    description: "Batteries, cables, chargers, bulbs, adapters",
    group: "Home essentials",
  },
  {
    value: "baby_care",
    label: "Baby care",
    emoji: "🧸",
    description: "Diapers, wipes, baby food, baby lotion",
    group: "Home essentials",
  },
  {
    value: "pet_supplies",
    label: "Pet supplies",
    emoji: "🐾",
    description: "Pet food, treats, grooming, litter, accessories",
    group: "Home essentials",
  },
  {
    value: "other",
    label: "Other household items",
    emoji: "📦",
    description: "Items that do not match another household category",
    group: "Other",
  },
];

export const categoryGroups = [
  "Food",
  "Home essentials",
  "Other",
] as const;

export const locationOptions: Array<{
  value: StorageLocation;
  label: string;
}> = [
  { value: "pantry", label: "Pantry / kitchen cabinet" },
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "medicine_box", label: "Medicine box" },
  { value: "bathroom", label: "Bathroom cabinet" },
  { value: "cleaning_shelf", label: "Cleaning shelf" },
  { value: "bedroom", label: "Bedroom / study" },
  { value: "garage", label: "Garage / storage room" },
  { value: "pooja", label: "Pooja / devotional shelf" },
  { value: "other", label: "Other location" },
];

export const unitOptions: Array<{
  value: InventoryUnit;
  label: string;
}> = [
  { value: "piece", label: "Piece" },
  { value: "packet", label: "Packet" },
  { value: "box", label: "Box" },
  { value: "bottle", label: "Bottle" },
  { value: "can", label: "Can" },
  { value: "jar", label: "Jar" },
  { value: "tube", label: "Tube" },
  { value: "strip", label: "Strip" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "litre", label: "Litre" },
  { value: "ml", label: "Millilitre (ml)" },
];

export function getCategoryMeta(category: InventoryCategory) {
  return (
    categoryOptions.find((option) => option.value === category) ??
    categoryOptions.find((option) => option.value === "other")!
  );
}

export function getLocationLabel(location: StorageLocation) {
  return (
    locationOptions.find((option) => option.value === location)?.label ??
    "Other location"
  );
}

export function getInventoryStatus(item: InventoryItem): InventoryStatus {
  if (item.is_finished || Number(item.quantity) <= 0) {
    return "finished";
  }

  if (item.expiry_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${item.expiry_date}T00:00:00`);
    const diffInMilliseconds = expiry.getTime() - today.getTime();
    const diffInDays = Math.ceil(
      diffInMilliseconds / (1000 * 60 * 60 * 24),
    );

    if (diffInDays < 0) {
      return "expired";
    }

    if (diffInDays <= 7) {
      return "expiring_soon";
    }
  }

  if (
    Number(item.minimum_quantity) > 0 &&
    Number(item.quantity) <= Number(item.minimum_quantity)
  ) {
    return "low_stock";
  }

  return "available";
}

export function getStatusMeta(status: InventoryStatus) {
  const statusMap: Record<
    InventoryStatus,
    {
      label: string;
      className: string;
    }
  > = {
    expired: {
      label: "Expired",
      className:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    },
    expiring_soon: {
      label: "Expiring soon",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },
    low_stock: {
      label: "Low stock",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    },
    finished: {
      label: "Finished",
      className:
        "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    available: {
      label: "Available",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
  };

  return statusMap[status];
}

export function formatQuantity(
  item: Pick<InventoryItem, "quantity" | "unit">,
) {
  const quantity = Number(item.quantity);

  return `${Number.isInteger(quantity) ? quantity : quantity.toFixed(2)} ${
    item.unit
  }`;
}

export function formatDate(date: string | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}