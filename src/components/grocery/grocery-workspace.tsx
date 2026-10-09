"use client";

import {
  AlertCircle,
  Check,
  CirclePlus,
  ClipboardList,
  PackageMinus,
  RefreshCw,
  ShoppingBasket,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  categoryOptions,
  getCategoryMeta,
  getInventoryStatus,
  unitOptions,
} from "@/lib/inventory";
import {
  formatGroceryQuantity,
  getPriorityMeta,
} from "@/lib/grocery";
import { createClient } from "@/lib/supabase/client";
import type {
  GroceryItem,
  GroceryPriority,
} from "@/types/grocery";
import type {
  InventoryCategory,
  InventoryItem,
  InventoryUnit,
} from "@/types/inventory";

type GroceryWorkspaceProps = {
  initialGroceryItems: GroceryItem[];
  inventoryItems: InventoryItem[];
  familyId: string;
  familyName: string;
  familyCode: string;
  userId: string;
  userRole: "owner" | "editor" | "viewer";
};

const emptyForm = {
  name: "",
  category: "food" as InventoryCategory,
  quantity: "1",
  unit: "piece" as InventoryUnit,
  priority: "medium" as GroceryPriority,
  notes: "",
};

export function GroceryWorkspace({
  initialGroceryItems,
  inventoryItems,
  familyId,
  familyName,
  familyCode,
  userId,
  userRole,
}: GroceryWorkspaceProps) {
  const [groceryItems, setGroceryItems] =
    useState<GroceryItem[]>(initialGroceryItems);
  const [form, setForm] = useState(emptyForm);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const canEdit = userRole === "owner" || userRole === "editor";
  const canDelete = userRole === "owner";

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`grocery-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grocery_items",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as GroceryItem;

            setGroceryItems((currentItems) => {
              const exists = currentItems.some(
                (item) => item.id === newItem.id,
              );

              return exists ? currentItems : [newItem, ...currentItems];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as GroceryItem;

            setGroceryItems((currentItems) =>
              currentItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedItem = payload.old as GroceryItem;

            setGroceryItems((currentItems) =>
              currentItems.filter((item) => item.id !== deletedItem.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId]);

  const pendingItems = useMemo(
    () =>
      groceryItems
        .filter((item) => item.status === "pending")
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };

          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
    [groceryItems],
  );

  const purchasedItems = useMemo(
    () =>
      groceryItems.filter((item) => item.status === "purchased"),
    [groceryItems],
  );

  const restockSuggestions = useMemo(() => {
    const grocerySourceIds = new Set(
      groceryItems
        .filter((item) => item.status === "pending")
        .map((item) => item.source_inventory_item_id)
        .filter(Boolean),
    );

    return inventoryItems
      .filter((item) => {
        const status = getInventoryStatus(item);

        return (
          (status === "low_stock" || status === "finished") &&
          !grocerySourceIds.has(item.id)
        );
      })
      .slice(0, 6);
  }, [groceryItems, inventoryItems]);

  const counts = useMemo(
    () => ({
      pending: pendingItems.length,
      purchased: purchasedItems.length,
      highPriority: pendingItems.filter((item) => item.priority === "high")
        .length,
      suggestions: restockSuggestions.length,
    }),
    [pendingItems, purchasedItems, restockSuggestions],
  );

  async function addGroceryItem(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    if (!form.name.trim()) {
      setActionError("Please enter a grocery item name.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      setActionError("Quantity must be greater than zero.");
      return;
    }

    setActionError("");
    setIsSubmitting(true);

    const supabase = createClient();

    const { data, error } = await supabase
      .from("grocery_items")
      .insert({
        family_id: familyId,
        name: form.name.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        priority: form.priority,
        status: "pending",
        notes: form.notes.trim() || null,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      setIsSubmitting(false);
      return;
    }

    setGroceryItems((currentItems) => [
      data as GroceryItem,
      ...currentItems,
    ]);
    setForm(emptyForm);
    setIsAdding(false);
    setIsSubmitting(false);
  }

  async function addRestockSuggestion(item: InventoryItem) {
    if (!canEdit) {
      return;
    }

    setActionError("");

    const status = getInventoryStatus(item);
    const suggestedQuantity =
      Number(item.minimum_quantity) > 0
        ? Math.max(
            Number(item.minimum_quantity) - Number(item.quantity),
            1,
          )
        : 1;

    const supabase = createClient();

    const { data, error } = await supabase
      .from("grocery_items")
      .insert({
        family_id: familyId,
        name: item.name,
        category: item.category,
        quantity: suggestedQuantity,
        unit: item.unit,
        priority: status === "finished" ? "high" : "medium",
        status: "pending",
        notes: `Suggested restock from inventory. Current stock: ${item.quantity} ${item.unit}.`,
        source_inventory_item_id: item.id,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      return;
    }

    setGroceryItems((currentItems) => [
      data as GroceryItem,
      ...currentItems,
    ]);
  }

  async function togglePurchased(item: GroceryItem) {
    if (!canEdit) {
      return;
    }

    setActionError("");

    const isPurchasing = item.status === "pending";
    const supabase = createClient();

    const { data, error } = await supabase
      .from("grocery_items")
      .update({
        status: isPurchasing ? "purchased" : "pending",
        purchased_by: isPurchasing ? userId : null,
        purchased_at: isPurchasing ? new Date().toISOString() : null,
      })
      .eq("id", item.id)
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      return;
    }

    setGroceryItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id ? (data as GroceryItem) : currentItem,
      ),
    );
  }

  async function deleteGroceryItem(item: GroceryItem) {
    if (!canDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${item.name}" from the grocery list?`,
    );

    if (!shouldDelete) {
      return;
    }

    setActionError("");

    const supabase = createClient();

    const { error } = await supabase
      .from("grocery_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      setActionError(error.message);
      return;
    }

    setGroceryItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id),
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
          <header className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Shared shopping
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                Grocery list
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Plan household purchases together and turn low-stock items into
                simple restock tasks.
              </p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAdding((current) => !current)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                <CirclePlus className="h-4 w-4" />
                Add grocery item
              </button>
            )}
          </header>

          <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Pending items",
                value: counts.pending,
                className:
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30",
              },
              {
                label: "High priority",
                value: counts.highPriority,
                className:
                  "border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/30",
              },
              {
                label: "Purchased",
                value: counts.purchased,
                className:
                  "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/30",
              },
              {
                label: "Restock suggestions",
                value: counts.suggestions,
                className:
                  "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30",
              },
            ].map((stat) => (
              <article
                key={stat.label}
                className={`rounded-2xl border p-4 ${stat.className}`}
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
            <div className="mt-6 flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                You have viewer access. You can view this shared grocery list,
                but only owners and editors can add or update items.
              </p>
            </div>
          )}

          {actionError && (
            <div className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{actionError}</p>
            </div>
          )}

          {isAdding && canEdit && (
            <section className="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-950 dark:bg-emerald-950/15 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-foreground">
                    Add a grocery item
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add something your family needs to buy.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card hover:text-foreground"
                  aria-label="Close grocery item form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={addGroceryItem}
                className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                <label className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <span className="text-sm font-bold text-foreground">
                    Item name
                  </span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Example: Eggs"
                    required
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Category
                  </span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value as InventoryCategory,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.emoji} {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Quantity
                  </span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    required
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Unit
                  </span>
                  <select
                    value={form.unit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        unit: event.target.value as InventoryUnit,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
                  >
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-bold text-foreground">
                    Priority
                  </span>
                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority: event.target.value as GroceryPriority,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="space-y-2 sm:col-span-2 lg:col-span-2">
                  <span className="text-sm font-bold text-foreground">
                    Notes
                  </span>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Optional: preferred brand, shop, etc."
                    className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <CirclePlus className="h-4 w-4" />
                        Add to list
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          )}

          {restockSuggestions.length > 0 && (
            <section className="mt-7 rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm dark:border-amber-950 dark:bg-amber-950/15 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-amber-900 dark:text-amber-100">
                    <PackageMinus className="h-4 w-4" />
                    Smart restock suggestions
                  </p>
                  <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/80">
                    Based on items that are low in stock or finished.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {restockSuggestions.map((item) => {
                  const category = getCategoryMeta(item.category);
                  const status = getInventoryStatus(item);

                  return (
                    <article
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-card p-4 dark:border-amber-950"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-amber-950">
                        {category.emoji}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-foreground">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {status === "finished"
                            ? "Finished"
                            : `Only ${item.quantity} ${item.unit} remaining`}
                        </p>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => addRestockSuggestion(item)}
                          className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 px-3 text-xs font-black text-white transition hover:bg-amber-600"
                        >
                          Add
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-2 text-lg font-black text-foreground">
                    <ShoppingBasket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    To buy
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pendingItems.length} pending{" "}
                    {pendingItems.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>

              {pendingItems.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {pendingItems.map((item) => {
                    const category = getCategoryMeta(item.category);
                    const priority = getPriorityMeta(item.priority);

                    return (
                      <article
                        key={item.id}
                        className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 transition hover:border-emerald-300 hover:shadow-sm dark:hover:border-emerald-800 sm:flex-row sm:items-center"
                      >
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => togglePurchased(item)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600 transition hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-400"
                          aria-label={`Mark ${item.name} as purchased`}
                        >
                          <Check className="h-4 w-4" />
                        </button>

                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl">
                          {category.emoji}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-black text-foreground">
                              {item.name}
                            </p>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${priority.className}`}
                            >
                              {priority.label}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatGroceryQuantity(item.quantity, item.unit)} ·{" "}
                            {category.label}
                          </p>

                          {item.notes && (
                            <p className="mt-1.5 truncate text-xs text-muted-foreground">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteGroceryItem(item)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                  <ClipboardList className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-4 font-black text-foreground">
                    Grocery list is clear
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add items manually or use suggestions from your inventory.
                  </p>
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
              <div>
                <p className="flex items-center gap-2 text-lg font-black text-foreground">
                  <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Purchased
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recently completed items
                </p>
              </div>

              {purchasedItems.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {purchasedItems.slice(0, 8).map((item) => {
                    const category = getCategoryMeta(item.category);

                    return (
                      <article
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3"
                      >
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => togglePurchased(item)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Move ${item.name} back to pending`}
                        >
                          <Check className="h-4 w-4" />
                        </button>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card text-lg">
                          {category.emoji}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-muted-foreground line-through">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatGroceryQuantity(item.quantity, item.unit)}
                          </p>
                        </div>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteGroceryItem(item)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                  <Check className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-4 font-black text-foreground">
                    Nothing purchased yet
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Completed grocery items will appear here.
                  </p>
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}