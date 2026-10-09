"use client";

import {
  AlertCircle,
  Check,
  ChefHat,
  Clock3,
  CookingPot,
  Leaf,
  ListPlus,
  Loader2,
  PackageCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  generateMockMealSuggestions,
  type AiMealSuggestion,
  type MealPlannerPreferences,
} from "@/lib/mock-ai/mock-meal-planner";
import { getInventoryStatus } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/client";
import type { GroceryItem } from "@/types/grocery";
import type { InventoryItem } from "@/types/inventory";
import type { MealSlot } from "@/types/meal";

type AiMealPlannerWorkspaceProps = {
  inventoryItems: InventoryItem[];
  pendingGroceryItems: GroceryItem[];
  familyId: string;
  familyName: string;
  familyCode: string;
  userId: string;
  userRole: "owner" | "editor" | "viewer";
};

const initialPreferences: MealPlannerPreferences = {
  mealType: "dinner",
  servings: 4,
  maxCookingMinutes: 30,
  dietaryPreference: "Vegetarian",
};

export function AiMealPlannerWorkspace({
  inventoryItems,
  pendingGroceryItems,
  familyId,
  familyName,
  familyCode,
  userId,
  userRole,
}: AiMealPlannerWorkspaceProps) {
  const [preferences, setPreferences] =
    useState<MealPlannerPreferences>(initialPreferences);
  const [suggestions, setSuggestions] = useState<AiMealSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canEdit = userRole === "owner" || userRole === "editor";

  const availableItems = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          !item.is_finished &&
          Number(item.quantity) > 0 &&
          getInventoryStatus(item) !== "expired",
      ),
    [inventoryItems],
  );

  const expiringItems = useMemo(
    () =>
      inventoryItems.filter(
        (item) => getInventoryStatus(item) === "expiring_soon",
      ),
    [inventoryItems],
  );

  async function handleGenerate() {
    setActionError("");
    setSuccessMessage("");
    setIsGenerating(true);

    try {
      const generated = await generateMockMealSuggestions(
        inventoryItems,
        preferences,
      );

      setSuggestions(generated);
    } catch {
      setActionError(
        "Unable to generate meal ideas right now. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function addMissingToGrocery(suggestion: AiMealSuggestion) {
    if (!canEdit || suggestion.missingIngredients.length === 0) {
      return;
    }

    setActionError("");
    setSuccessMessage("");

    const pendingNames = new Set(
      pendingGroceryItems.map((item) => item.name.toLowerCase()),
    );

    const itemsToAdd = suggestion.missingIngredients.filter(
      (name) => !pendingNames.has(name.toLowerCase()),
    );

    if (itemsToAdd.length === 0) {
      setSuccessMessage(
        "All missing ingredients are already in your pending grocery list.",
      );
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.from("grocery_items").insert(
      itemsToAdd.map((name) => ({
        family_id: familyId,
        name,
        category: "food",
        quantity: 1,
        unit: "piece",
        priority: "medium",
        status: "pending",
        notes: `Needed for AI meal suggestion: ${suggestion.title}.`,
        created_by: userId,
      })),
    );

    if (error) {
      setActionError(error.message);
      return;
    }

    setSuccessMessage(
      `${itemsToAdd.length} ingredient${
        itemsToAdd.length === 1 ? "" : "s"
      } added to the grocery list.`,
    );
  }

  async function addSuggestionToMealPlanner(suggestion: AiMealSuggestion) {
    if (!canEdit) {
      return;
    }

    setActionError("");
    setSuccessMessage("");

    const today = new Date();
    const mealDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    const supabase = createClient();

    const { error } = await supabase.from("meal_plans").upsert(
      {
        family_id: familyId,
        meal_date: mealDate,
        meal_slot: suggestion.mealType as MealSlot,
        recipe_name: suggestion.title,
        servings: suggestion.servings,
        preparation_minutes: suggestion.preparationMinutes,
        dietary_tag: suggestion.dietaryTag,
        ingredients: suggestion.ingredients,
        notes: `${suggestion.description} AI reason: ${suggestion.reason}`,
        status: "planned",
        created_by: userId,
        updated_by: userId,
      },
      {
        onConflict: "family_id,meal_date,meal_slot",
      },
    );

    if (error) {
      setActionError(error.message);
      return;
    }

    setSuccessMessage(
      `${suggestion.title} was added to today's ${suggestion.mealType} plan.`,
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 p-6 text-white shadow-xl shadow-emerald-950/15 sm:p-8">
            <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(to_right,rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:42px_42px]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-100">
                  <Sparkles className="h-4 w-4" />
                  Mock AI meal planner
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Cook smarter with what you already have.
                </h1>
                <p className="mt-4 text-sm leading-7 text-emerald-50 sm:text-base">
                  Get meal ideas based on your live family inventory, items
                  nearing expiry, available preparation time, and dietary
                  preference.
                </p>
              </div>

              <Link
                href="/meal-planner"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <CookingPot className="h-4 w-4" />
                Open weekly planner
              </Link>
            </div>
          </header>

          <section className="mt-7 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <ChefHat className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-black text-foreground">
                    Your preferences
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tell the planner what you need today.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Meal type
                  </span>
                  <select
                    value={preferences.mealType}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        mealType: event.target
                          .value as MealPlannerPreferences["mealType"],
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="snacks">Snacks</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Number of servings
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={preferences.servings}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        servings: Number(event.target.value) || 1,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Maximum cooking time
                  </span>
                  <select
                    value={preferences.maxCookingMinutes}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        maxCookingMinutes: Number(event.target.value),
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="15">15 minutes</option>
                    <option value="20">20 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Dietary preference
                  </span>
                  <select
                    value={preferences.dietaryPreference}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        dietaryPreference: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="High protein">High protein</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Jain-friendly">Jain-friendly</option>
                    <option value="No preference">No preference</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing inventory...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate meal ideas
                    </>
                  )}
                </button>
              </div>
            </article>

            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-lg font-black text-foreground">
                    <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Inventory context
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These items are considered by the planner.
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {availableItems.length} available
                  </span>
                  <span className="rounded-xl bg-amber-100 px-3 py-2 text-xs font-black text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    {expiringItems.length} expiring
                  </span>
                </div>
              </div>

              {expiringItems.length > 0 && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-950 dark:bg-amber-950/25">
                  <p className="flex items-center gap-2 text-sm font-black text-amber-800 dark:text-amber-200">
                    <Leaf className="h-4 w-4" />
                    Use these first
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {expiringItems.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full bg-card px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm dark:text-amber-200"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {availableItems.length > 0 ? (
                  availableItems.slice(0, 24).map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                    >
                      {item.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Add inventory items first. The AI planner will then use
                    them to produce better suggestions.
                  </p>
                )}
              </div>
            </article>
          </section>

          {actionError && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{actionError}</p>
            </div>
          )}

          {successMessage && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          {isGenerating && (
            <section className="mt-7 flex min-h-80 items-center justify-center rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="max-w-md text-center">
                <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="absolute inset-0 animate-ping rounded-3xl bg-emerald-400/30" />
                  <Sparkles className="relative h-8 w-8" />
                </span>
                <h2 className="mt-6 text-2xl font-black text-foreground">
                  Building your meal ideas
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Checking what is available, prioritizing expiring items, and
                  reducing unnecessary grocery purchases.
                </p>
              </div>
            </section>
          )}

          {!isGenerating && suggestions.length === 0 && (
            <section className="mt-7 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <UtensilsCrossed className="h-7 w-7" />
              </span>
              <h2 className="mt-5 text-xl font-black text-foreground">
                Ready to plan something delicious?
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                Set your preferences and let the Mock AI Meal Planner turn
                your existing household inventory into practical meal ideas.
              </p>
            </section>
          )}

          {!isGenerating && suggestions.length > 0 && (
            <section className="mt-7">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Personalized recommendations
                </p>
                <h2 className="mt-2 text-2xl font-black text-foreground">
                  Your best meal ideas right now
                </h2>
              </div>

              <div className="grid gap-5 xl:grid-cols-3">
                {suggestions.map((suggestion, index) => (
                  <article
                    key={suggestion.id}
                    className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
                  >
                    <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-600 p-5 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                          <ChefHat className="h-5 w-5" />
                        </span>
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                          Idea {index + 1}
                        </span>
                      </div>
                      <h3 className="mt-6 text-xl font-black">
                        {suggestion.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-emerald-50">
                        {suggestion.description}
                      </p>
                    </div>

                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                          <Clock3 className="h-3 w-3" />
                          {suggestion.preparationMinutes} min
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                          <UtensilsCrossed className="h-3 w-3" />
                          {suggestion.servings} servings
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {suggestion.dietaryTag}
                        </span>
                      </div>

                      <div className="mt-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                          Why this was suggested
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {suggestion.reason}
                        </p>
                      </div>

                      {suggestion.expiringIngredientsUsed.length > 0 && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-950 dark:bg-amber-950/25">
                          <p className="text-xs font-black text-amber-800 dark:text-amber-200">
                            Uses soon-to-expire items
                          </p>
                          <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
                            {suggestion.expiringIngredientsUsed.join(", ")}
                          </p>
                        </div>
                      )}

                      <div className="mt-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                          Ingredients
                        </p>
                        <div className="mt-3 space-y-2">
                          {suggestion.ingredients.map((ingredient) => {
                            const isMissing = suggestion.missingIngredients.includes(
                              ingredient.name,
                            );

                            return (
                              <div
                                key={ingredient.name}
                                className="flex items-center justify-between gap-3 rounded-xl bg-muted/55 px-3 py-2 text-xs"
                              >
                                <span
                                  className={
                                    isMissing
                                      ? "font-bold text-amber-700 dark:text-amber-300"
                                      : "font-semibold text-foreground"
                                  }
                                >
                                  {ingredient.name}
                                </span>
                                <span className="text-muted-foreground">
                                  {ingredient.quantity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-5">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                          Quick method
                        </p>
                        <ol className="mt-3 space-y-2">
                          {suggestion.steps.slice(0, 3).map((step, stepIndex) => (
                            <li
                              key={step}
                              className="flex gap-2 text-xs leading-5 text-muted-foreground"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {stepIndex + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {canEdit && (
                        <div className="mt-6 grid gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              addSuggestionToMealPlanner(suggestion)
                            }
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                          >
                            <CookingPot className="h-4 w-4" />
                            Add to today&apos;s plan
                          </button>

                          {suggestion.missingIngredients.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                addMissingToGrocery(suggestion)
                              }
                              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-950 dark:bg-amber-950/25 dark:text-amber-200 dark:hover:bg-amber-950/40"
                            >
                              <ListPlus className="h-4 w-4" />
                              Add {suggestion.missingIngredients.length} missing
                              to grocery list
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}