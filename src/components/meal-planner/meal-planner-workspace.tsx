"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CirclePlus,
  Clock3,
  CookingPot,
  ListPlus,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  formatDateInput,
  getIngredientAvailability,
  getMealStatusMeta,
  getStartOfWeek,
  getWeekDays,
  isToday,
  mealPlanKey,
  mealSlots,
  parseIngredients,
} from "@/lib/meal-planner";
import { createClient } from "@/lib/supabase/client";
import type { GroceryItem } from "@/types/grocery";
import type { InventoryItem } from "@/types/inventory";
import type { MealPlan, MealSlot, MealStatus } from "@/types/meal";

type MealPlannerWorkspaceProps = {
  initialMeals: MealPlan[];
  inventoryItems: InventoryItem[];
  pendingGroceryItems: GroceryItem[];
  familyId: string;
  familyName: string;
  familyCode: string;
  userId: string;
  userRole: "owner" | "editor" | "viewer";
};

type MealForm = {
  mealDate: string;
  mealSlot: MealSlot;
  recipeName: string;
  servings: string;
  preparationMinutes: string;
  dietaryTag: string;
  ingredientsInput: string;
  notes: string;
};

function getEmptyMealForm(
  mealDate: string,
  mealSlot: MealSlot,
): MealForm {
  return {
    mealDate,
    mealSlot,
    recipeName: "",
    servings: "4",
    preparationMinutes: "30",
    dietaryTag: "Vegetarian",
    ingredientsInput: "",
    notes: "",
  };
}

export function MealPlannerWorkspace({
  initialMeals,
  inventoryItems,
  pendingGroceryItems,
  familyId,
  familyName,
  familyCode,
  userId,
  userRole,
}: MealPlannerWorkspaceProps) {
  const [meals, setMeals] = useState<MealPlan[]>(initialMeals);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<MealForm>(() =>
    getEmptyMealForm(formatDateInput(getStartOfWeek()), "breakfast"),
  );
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = userRole === "owner" || userRole === "editor";
  const canDelete = userRole === "owner";

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const weekStartKey = weekDays[0].dateKey;
  const weekEndKey = weekDays[6].dateKey;

  const visibleMeals = useMemo(
    () =>
      meals.filter(
        (meal) =>
          meal.meal_date >= weekStartKey && meal.meal_date <= weekEndKey,
      ),
    [meals, weekEndKey, weekStartKey],
  );

  const mealMap = useMemo(() => {
    const map = new Map<string, MealPlan>();

    for (const meal of visibleMeals) {
      map.set(mealPlanKey(meal.meal_date, meal.meal_slot), meal);
    }

    return map;
  }, [visibleMeals]);

  const plannedSummary = useMemo(
    () => ({
      total: visibleMeals.length,
      cooked: visibleMeals.filter((meal) => meal.status === "cooked").length,
      planned: visibleMeals.filter((meal) => meal.status === "planned").length,
      missingIngredients: visibleMeals.reduce((total, meal) => {
        const { missing } = getIngredientAvailability(
          meal.ingredients,
          inventoryItems,
        );

        return total + missing.length;
      }, 0),
    }),
    [inventoryItems, visibleMeals],
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`meal-plans-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meal_plans",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMeal = payload.new as MealPlan;

            setMeals((currentMeals) => {
              const existingIndex = currentMeals.findIndex(
                (meal) => meal.id === newMeal.id,
              );

              if (existingIndex >= 0) {
                return currentMeals;
              }

              return [...currentMeals, newMeal];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updatedMeal = payload.new as MealPlan;

            setMeals((currentMeals) =>
              currentMeals.map((meal) =>
                meal.id === updatedMeal.id ? updatedMeal : meal,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedMeal = payload.old as MealPlan;

            setMeals((currentMeals) =>
              currentMeals.filter((meal) => meal.id !== deletedMeal.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  function moveWeek(direction: "previous" | "next") {
    setWeekStart((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setDate(
        currentDate.getDate() + (direction === "next" ? 7 : -7),
      );

      return nextDate;
    });
  }

  function openMealForm(mealDate: string, mealSlot: MealSlot) {
    if (!canEdit) {
      return;
    }

    setActionError("");
    setForm(getEmptyMealForm(mealDate, mealSlot));
    setIsFormOpen(true);
  }

  function closeMealForm() {
    if (isSubmitting) {
      return;
    }

    setIsFormOpen(false);
  }

  async function addMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    if (!form.recipeName.trim()) {
      setActionError("Recipe name is required.");
      return;
    }

    const ingredients = parseIngredients(form.ingredientsInput);

    if (ingredients.length === 0) {
      setActionError(
        "Add at least one ingredient, separated by commas. Example: Rice, Tomato, Paneer",
      );
      return;
    }

    setActionError("");
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("meal_plans")
      .insert({
        family_id: familyId,
        meal_date: form.mealDate,
        meal_slot: form.mealSlot,
        recipe_name: form.recipeName.trim(),
        servings: Number(form.servings) || 1,
        preparation_minutes: form.preparationMinutes
          ? Number(form.preparationMinutes)
          : null,
        dietary_tag: form.dietaryTag.trim() || null,
        ingredients,
        notes: form.notes.trim() || null,
        status: "planned",
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      setIsSubmitting(false);
      return;
    }

    setMeals((currentMeals) => [...currentMeals, data as MealPlan]);
    setIsSubmitting(false);
    setIsFormOpen(false);
  }

  async function updateMealStatus(meal: MealPlan, status: MealStatus) {
    if (!canEdit) {
      return;
    }

    setActionError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("meal_plans")
      .update({
        status,
        updated_by: userId,
      })
      .eq("id", meal.id)
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      return;
    }

    setMeals((currentMeals) =>
      currentMeals.map((currentMeal) =>
        currentMeal.id === meal.id ? (data as MealPlan) : currentMeal,
      ),
    );
  }

  async function deleteMeal(meal: MealPlan) {
    if (!canDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${meal.recipe_name}" from the meal plan?`,
    );

    if (!shouldDelete) {
      return;
    }

    setActionError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("meal_plans")
      .delete()
      .eq("id", meal.id);

    if (error) {
      setActionError(error.message);
      return;
    }

    setMeals((currentMeals) =>
      currentMeals.filter((currentMeal) => currentMeal.id !== meal.id),
    );
  }

  async function addMissingIngredientsToGrocery(meal: MealPlan) {
    if (!canEdit) {
      return;
    }

    const { missing } = getIngredientAvailability(
      meal.ingredients,
      inventoryItems,
    );

    if (missing.length === 0) {
      return;
    }

    const existingPendingNames = new Set(
      pendingGroceryItems.map((item) => item.name.toLowerCase()),
    );

    const itemsToCreate = missing.filter(
      (ingredient) =>
        !existingPendingNames.has(ingredient.name.toLowerCase()),
    );

    if (itemsToCreate.length === 0) {
      setActionError(
        "All missing ingredients are already in your pending grocery list.",
      );
      return;
    }

    setActionError("");

    const supabase = createClient();

    const { error } = await supabase.from("grocery_items").insert(
      itemsToCreate.map((ingredient) => ({
        family_id: familyId,
        name: ingredient.name,
        category: "food",
        quantity: 1,
        unit: "piece",
        priority: "medium",
        status: "pending",
        notes: `Needed for ${meal.recipe_name}${
          ingredient.quantity ? ` (${ingredient.quantity})` : ""
        }.`,
        created_by: userId,
      })),
    );

    if (error) {
      setActionError(error.message);
      return;
    }

    window.alert(
      `${itemsToCreate.length} missing ingredient${
        itemsToCreate.length === 1 ? "" : "s"
      } added to the grocery list.`,
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-[1600px] px-4 py-7 sm:px-6 lg:px-8">
          <header className="border border-border bg-card p-6 shadow-sm lg:flex lg:items-center lg:justify-between lg:gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Weekly food planning
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                Meal planner
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Plan meals around your available home inventory, reduce waste,
                and add missing ingredients directly to the grocery list.
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() =>
                  openMealForm(
                    weekDays.find((day) => isToday(day.dateKey))?.dateKey ??
                      weekDays[0].dateKey,
                    "dinner",
                  )
                }
                className="button-primary mt-5 h-11 lg:mt-0"
              >
                <CirclePlus className="h-4 w-4" aria-hidden="true" />
                Plan a meal
              </button>
            )}
          </header>

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Meals planned",
                value: plannedSummary.total,
                className:
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30",
              },
              {
                label: "Meals cooked",
                value: plannedSummary.cooked,
                className:
                  "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/30",
              },
              {
                label: "Still planned",
                value: plannedSummary.planned,
                className:
                  "border-violet-200 bg-violet-50 dark:border-violet-950 dark:bg-violet-950/30",
              },
              {
                label: "Missing ingredients",
                value: plannedSummary.missingIngredients,
                className:
                  "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30",
              },
            ].map((stat) => (
              <article
                key={stat.label}
                className={`border p-4 ${stat.className}`}
              >
                <p className="text-2xl font-black text-foreground">
                  {stat.value}
                </p>

                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {stat.label}
                </p>
              </article>
            ))}
          </section>

          {!canEdit && (
            <div className="mt-6 flex gap-3 border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-200">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                You have viewer access. You can view the family meal plan, but
                only owners and editors can add or update meals.
              </p>
            </div>
          )}

          {actionError && (
            <div className="mt-6 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>{actionError}</p>
            </div>
          )}

          <section className="mt-7 border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-foreground">
                  Your weekly menu
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {weekDays[0].fullDate} to {weekDays[6].fullDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveWeek("previous")}
                  className="inline-flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition hover:bg-muted"
                  aria-label="Previous week"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setWeekStart(getStartOfWeek())}
                  className="button-secondary h-10 px-3"
                >
                  This week
                </button>

                <button
                  type="button"
                  onClick={() => moveWeek("next")}
                  className="inline-flex h-10 w-10 items-center justify-center border border-border bg-background text-foreground transition hover:bg-muted"
                  aria-label="Next week"
                >
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>

          <section className="mt-7 overflow-x-auto pb-4">
            <div className="min-w-[1100px] overflow-hidden border border-border bg-card shadow-sm">
              <div className="grid grid-cols-[150px_repeat(7,minmax(135px,1fr))] border-b border-border bg-muted/50">
                <div className="p-4 text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                  Meal
                </div>

                {weekDays.map((day) => (
                  <div
                    key={day.dateKey}
                    className={`border-l border-border p-4 text-center ${
                      isToday(day.dateKey)
                        ? "bg-emerald-50 dark:bg-emerald-950/30"
                        : ""
                    }`}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {day.shortDay}
                    </p>

                    <p className="mt-1 text-lg font-black text-foreground">
                      {day.dayNumber}
                    </p>
                  </div>
                ))}
              </div>

              {mealSlots.map((slot) => (
                <div
                  key={slot.value}
                  className="grid grid-cols-[150px_repeat(7,minmax(135px,1fr))] border-b border-border last:border-b-0"
                >
                  <div className="flex min-h-44 flex-col justify-center bg-muted/30 p-4">
                    <span className="text-2xl" aria-hidden="true">
                      {slot.emoji}
                    </span>

                    <p className="mt-2 text-sm font-black text-foreground">
                      {slot.label}
                    </p>
                  </div>

                  {weekDays.map((day) => {
                    const meal = mealMap.get(
                      mealPlanKey(day.dateKey, slot.value),
                    );

                    if (!meal) {
                      return (
                        <div
                          key={`${day.dateKey}-${slot.value}`}
                          className={`flex min-h-44 border-l border-border p-3 ${
                            isToday(day.dateKey)
                              ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                              : ""
                          }`}
                        >
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                openMealForm(day.dateKey, slot.value)
                              }
                              className="flex h-full w-full flex-col items-center justify-center border border-dashed border-border px-3 text-center text-muted-foreground transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                            >
                              <CirclePlus
                                className="h-5 w-5"
                                aria-hidden="true"
                              />

                              <span className="mt-2 text-xs font-bold">
                                Add meal
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    const availability = getIngredientAvailability(
                      meal.ingredients,
                      inventoryItems,
                    );
                    const mealStatus = getMealStatusMeta(meal.status);

                    return (
                      <div
                        key={meal.id}
                        className={`min-h-44 border-l border-border p-3 ${
                          isToday(day.dateKey)
                            ? "bg-emerald-50/30 dark:bg-emerald-950/10"
                            : ""
                        }`}
                      >
                        <article className="h-full border border-border bg-background p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-black text-foreground">
                              {meal.recipe_name}
                            </p>

                            <span
                              className={`shrink-0 border px-2 py-1 text-[9px] font-bold ${mealStatus.className}`}
                            >
                              {mealStatus.label}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                            <p className="flex items-center gap-1.5">
                              <Clock3
                                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                                aria-hidden="true"
                              />
                              {meal.preparation_minutes
                                ? `${meal.preparation_minutes} min`
                                : "Time not set"}
                            </p>

                            <p className="flex items-center gap-1.5">
                              <UtensilsCrossed
                                className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                                aria-hidden="true"
                              />
                              {meal.servings} servings
                            </p>
                          </div>

                          <div className="mt-3">
                            {availability.missing.length > 0 ? (
                              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                                Missing: {availability.missing.length}
                              </p>
                            ) : (
                              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                Ingredients available
                              </p>
                            )}
                          </div>

                          {canEdit && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {meal.status !== "cooked" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateMealStatus(meal, "cooked")
                                  }
                                  className="inline-flex items-center gap-1 bg-emerald-600 px-2 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-700"
                                >
                                  <CheckCircle2
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  Cooked
                                </button>
                              )}

                              {availability.missing.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    addMissingIngredientsToGrocery(meal)
                                  }
                                  className="inline-flex items-center gap-1 bg-amber-100 px-2 py-1.5 text-[10px] font-bold text-amber-800 transition hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-950"
                                >
                                  <ListPlus
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  Add missing
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteMeal(meal)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                                  aria-label={`Delete ${meal.recipe_name}`}
                                >
                                  <Trash2
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                  />
                                </button>
                              )}
                            </div>
                          )}
                        </article>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-7 border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CookingPot className="h-5 w-5" aria-hidden="true" />
              </span>

              <div>
                <p className="text-lg font-black text-foreground">
                  Plan meals around what you already have
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Add ingredients in the meal form. GharScan Buddy compares
                  them with your inventory and highlights what is missing.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meal-form-title"
        >
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden border border-border bg-card shadow-2xl sm:max-h-[calc(100vh-3rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Weekly meal planner
                </p>

                <h2
                  id="meal-form-title"
                  className="mt-1 text-xl font-black text-foreground"
                >
                  Plan a meal
                </h2>
              </div>

              <button
                type="button"
                onClick={closeMealForm}
                disabled={isSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close meal form"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={addMeal}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Date
                    </span>

                    <input
                      type="date"
                      value={form.mealDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          mealDate: event.target.value,
                        }))
                      }
                      required
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Meal slot
                    </span>

                    <select
                      value={form.mealSlot}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          mealSlot: event.target.value as MealSlot,
                        }))
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
                    >
                      {mealSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.emoji} {slot.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Recipe / meal name
                    </span>

                    <input
                      type="text"
                      value={form.recipeName}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          recipeName: event.target.value,
                        }))
                      }
                      placeholder="Example: Palak Paneer with Jeera Rice"
                      required
                      maxLength={150}
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Servings
                    </span>

                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={form.servings}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          servings: event.target.value,
                        }))
                      }
                      required
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Preparation time (minutes)
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="1440"
                      value={form.preparationMinutes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          preparationMinutes: event.target.value,
                        }))
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Dietary tag
                    </span>

                    <input
                      type="text"
                      value={form.dietaryTag}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          dietaryTag: event.target.value,
                        }))
                      }
                      placeholder="Example: Vegetarian, High protein, Vegan"
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Ingredients
                    </span>

                    <textarea
                      value={form.ingredientsInput}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          ingredientsInput: event.target.value,
                        }))
                      }
                      placeholder="Example: Paneer: 250 g, Spinach: 2 bunches, Rice: 2 cups, Onion"
                      required
                      rows={4}
                      className="w-full resize-none border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <span className="block text-xs leading-5 text-muted-foreground">
                      Separate ingredients with commas. Optionally add quantity
                      after a colon.
                    </span>
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Notes
                    </span>

                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      placeholder="Optional cooking notes or special instructions"
                      rows={3}
                      className="w-full resize-none border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border bg-card p-5 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeMealForm}
                  disabled={isSubmitting}
                  className="button-secondary h-12 px-5 text-muted-foreground disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button-primary h-12 px-5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Clock3
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Saving meal...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Save meal plan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}