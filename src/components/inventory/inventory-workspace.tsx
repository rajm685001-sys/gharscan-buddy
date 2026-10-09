"use client";

import {
  AlertCircle,
  ArchiveX,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  List,
  PackagePlus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AddInventoryItemDialog } from "@/components/inventory/add-inventory-item-dialog";
import { InventoryItemCard } from "@/components/inventory/inventory-item-card";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import {
  categoryGroups,
  categoryOptions,
  getInventoryStatus,
  locationOptions,
} from "@/lib/inventory";
import { createClient } from "@/lib/supabase/client";
import type {
  InventoryCategory,
  InventoryItem,
  InventoryStatus,
} from "@/types/inventory";

type InventoryWorkspaceProps = {
  initialItems: InventoryItem[];
  familyId: string;
  familyName: string;
  familyCode: string;
  userId: string;
  userRole: "owner" | "editor" | "viewer";
  selectedLocation?: string;
  selectedItemId?: string;
};

type ViewMode = "grid" | "list";
type StatusFilter = "all" | InventoryStatus;

export function InventoryWorkspace({
  initialItems,
  familyId,
  familyName,
  familyCode,
  userId,
  userRole,
  selectedLocation = "all",
  selectedItemId = "",
}: InventoryWorkspaceProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | InventoryCategory>("all");
  const [locationFilter, setLocationFilter] = useState(selectedLocation);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [actionError, setActionError] = useState("");

  const canEdit = userRole === "owner" || userRole === "editor";
  const canDelete = userRole === "owner";

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`inventory-${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_items",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as InventoryItem;

            setItems((currentItems) => {
              const alreadyExists = currentItems.some(
                (item) => item.id === newItem.id,
              );

              return alreadyExists
                ? currentItems
                : [newItem, ...currentItems];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as InventoryItem;

            setItems((currentItems) =>
              currentItems.map((item) =>
                item.id === updatedItem.id ? updatedItem : item,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedItem = payload.old as InventoryItem;

            setItems((currentItems) =>
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

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.brand?.toLowerCase().includes(normalizedQuery) ||
        item.notes?.toLowerCase().includes(normalizedQuery);

      const matchesCategory = category === "all" || item.category === category;

      const matchesLocation =
        locationFilter === "all" ||
        item.storage_location === locationFilter;

      const matchesStatus =
        status === "all" || getInventoryStatus(item) === status;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesLocation &&
        matchesStatus
      );
    });
  }, [items, query, category, locationFilter, status]);

  const groupedInventory = useMemo(() => {
    return categoryOptions
      .map((categoryOption) => {
        const categoryItems = filteredItems.filter(
          (item) => item.category === categoryOption.value,
        );

        return {
          ...categoryOption,
          items: categoryItems,
        };
      })
      .filter((section) => section.items.length > 0);
  }, [filteredItems]);

  const statusCounts = useMemo(() => {
    return {
      total: items.length,
      expiring: items.filter(
        (item) => getInventoryStatus(item) === "expiring_soon",
      ).length,
      expired: items.filter(
        (item) => getInventoryStatus(item) === "expired",
      ).length,
      lowStock: items.filter(
        (item) => getInventoryStatus(item) === "low_stock",
      ).length,
    };
  }, [items]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    category !== "all" ||
    locationFilter !== "all" ||
    status !== "all";

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setLocationFilter("all");
    setStatus("all");
  }

  function toggleCategory(categoryValue: string) {
    setCollapsedCategories((currentCategories) =>
      currentCategories.includes(categoryValue)
        ? currentCategories.filter(
            (currentCategory) => currentCategory !== categoryValue,
          )
        : [...currentCategories, categoryValue],
    );
  }

  async function consumeItem(item: InventoryItem) {
    if (!canEdit) {
      return;
    }

    setActionError("");

    const shouldFinish = window.confirm(
      `Mark "${item.name}" as finished? This will set its quantity to 0.`,
    );

    if (!shouldFinish) {
      return;
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        quantity: 0,
        is_finished: true,
        updated_by: userId,
      })
      .eq("id", item.id)
      .select()
      .single();

    if (error) {
      setActionError(error.message);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((currentItem) =>
        currentItem.id === item.id ? (data as InventoryItem) : currentItem,
      ),
    );
  }

  async function deleteItem(item: InventoryItem) {
    if (!canDelete) {
      return;
    }

    setActionError("");

    const shouldDelete = window.confirm(
      `Delete "${item.name}" permanently? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    const supabase = createClient();

    if (item.image_path) {
      const { error: imageError } = await supabase.storage
        .from("inventory-images")
        .remove([item.image_path]);

      if (imageError) {
        setActionError(
          `The item image could not be removed: ${imageError.message}`,
        );
        return;
      }
    }

    const { error } = await supabase
      .from("inventory_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      setActionError(error.message);
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id),
    );
  }

  function openEdit(item: InventoryItem) {
    window.alert(
      `Edit for "${item.name}" will be added during final refinement. You can currently add, scan, consume, and delete inventory items.`,
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 shadow-sm backdrop-blur-xl">
          <div className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                {familyName}
              </p>

              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-foreground sm:text-2xl">
                Home inventory
              </h1>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {canEdit ? (
                <AddInventoryItemDialog
                  familyId={familyId}
                  userId={userId}
                  onItemAdded={(item) => {
                    setItems((currentItems) => [item, ...currentItems]);
                  }}
                />
              ) : (
                <span className="hidden border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 sm:inline-flex dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-300">
                  Viewer access
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "Total items",
                value: statusCounts.total,
                className:
                  "border-emerald-200 bg-emerald-50 dark:border-emerald-950 dark:bg-emerald-950/30",
              },
              {
                label: "Expiring soon",
                value: statusCounts.expiring,
                className:
                  "border-amber-200 bg-amber-50 dark:border-amber-950 dark:bg-amber-950/30",
              },
              {
                label: "Expired",
                value: statusCounts.expired,
                className:
                  "border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/30",
              },
              {
                label: "Low stock",
                value: statusCounts.lowStock,
                className:
                  "border-sky-200 bg-sky-50 dark:border-sky-950 dark:bg-sky-950/30",
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

          <section className="mt-7 border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search across all household categories..."
                  className="h-12 w-full border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((current) => !current)}
                  className={`inline-flex h-12 items-center gap-2 border px-4 text-sm font-bold transition ${
                    filtersOpen
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-input bg-background text-foreground hover:bg-muted"
                  }`}
                  aria-expanded={filtersOpen}
                >
                  <SlidersHorizontal
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  Filters
                </button>

                <div className="hidden overflow-hidden border border-input sm:flex">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`inline-flex h-12 w-12 items-center justify-center transition ${
                      viewMode === "grid"
                        ? "bg-emerald-600 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid"}
                  >
                    <Grid2X2 className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`inline-flex h-12 w-12 items-center justify-center transition ${
                      viewMode === "list"
                        ? "bg-emerald-600 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                  >
                    <List className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {filtersOpen && (
              <div className="mt-4 grid gap-4 border-t border-border pt-4 lg:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Category
                  </span>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value as "all" | InventoryCategory,
                      )
                    }
                    className="h-11 w-full border border-input bg-background px-3 text-sm font-semibold outline-none transition focus:border-emerald-500"
                  >
                    <option value="all">All categories</option>

                    {categoryGroups.map((group) => (
                      <optgroup key={group} label={group}>
                        {categoryOptions
                          .filter((option) => option.group === group)
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.emoji} {option.label}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Home zone
                  </span>

                  <select
                    value={locationFilter}
                    onChange={(event) =>
                      setLocationFilter(event.target.value)
                    }
                    className="h-11 w-full border border-input bg-background px-3 text-sm font-semibold outline-none transition focus:border-emerald-500"
                  >
                    <option value="all">All home zones</option>

                    {locationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Status
                  </span>

                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StatusFilter)
                    }
                    className="h-11 w-full border border-input bg-background px-3 text-sm font-semibold outline-none transition focus:border-emerald-500"
                  >
                    <option value="all">All statuses</option>
                    <option value="available">Available</option>
                    <option value="expiring_soon">Expiring soon</option>
                    <option value="expired">Expired</option>
                    <option value="low_stock">Low stock</option>
                    <option value="finished">Finished</option>
                  </select>
                </label>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-auto inline-flex h-11 items-center justify-center gap-2 px-3 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Clear filters
                </button>
              </div>
            )}
          </section>

          {actionError && (
            <div className="mt-5 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>{actionError}</p>
            </div>
          )}

          {!canEdit && (
            <div className="mt-5 flex gap-3 border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-200">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                You have viewer access. You can view the family inventory, but
                only Owners and Editors can add, scan, or update items.
              </p>
            </div>
          )}

          <section className="mt-7">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  {hasActiveFilters
                    ? "Search and filter results"
                    : "Organized by use case"}
                </p>

                <h2 className="mt-1 text-2xl font-black text-foreground">
                  {hasActiveFilters
                    ? `${filteredItems.length} matching ${
                        filteredItems.length === 1 ? "item" : "items"
                      }`
                    : "Your household essentials"}
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Items remain grouped by their category."
                    : "Items are automatically grouped by purpose and use case."}
                </p>
              </div>

              {!hasActiveFilters && groupedInventory.length > 0 && (
                <p className="text-sm font-semibold text-muted-foreground">
                  {groupedInventory.length}{" "}
                  {groupedInventory.length === 1 ? "category" : "categories"}{" "}
                  in use
                </p>
              )}
            </div>

            {groupedInventory.length > 0 ? (
              <div className="space-y-10">
                {groupedInventory.map((section) => {
                  const isCollapsed = collapsedCategories.includes(
                    section.value,
                  );

                  return (
                    <section key={section.value}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(section.value)}
                        className="group flex w-full items-center justify-between gap-4 border border-border bg-card p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:hover:border-emerald-800 sm:p-5"
                        aria-expanded={!isCollapsed}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-emerald-50 text-2xl dark:bg-emerald-950/40">
                            {section.emoji}
                          </span>

                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-lg font-black text-foreground">
                                {section.label}
                              </span>

                              <span className="border border-border bg-muted px-2.5 py-1 text-[10px] font-black text-muted-foreground">
                                {section.items.length}{" "}
                                {section.items.length === 1 ? "item" : "items"}
                              </span>
                            </span>

                            <span className="mt-1 block truncate text-sm text-muted-foreground">
                              {section.description}
                            </span>
                          </span>
                        </span>

                        <span className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground transition group-hover:bg-muted group-hover:text-foreground">
                          {isCollapsed ? (
                            <ChevronDown
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          ) : (
                            <ChevronUp
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div
                          className={
                            viewMode === "grid"
                              ? "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                              : "mt-4 space-y-3"
                          }
                        >
                          {section.items.map((item) => (
                            <div
                              key={item.id}
                              className={
                                selectedItemId === item.id
                                  ? "rounded-3xl ring-2 ring-emerald-500 ring-offset-4 ring-offset-background"
                                  : ""
                              }
                            >
                              <InventoryItemCard
                                item={item}
                                viewMode={viewMode}
                                canEdit={canEdit}
                                canDelete={canDelete}
                                onEdit={openEdit}
                                onConsume={consumeItem}
                                onDelete={deleteItem}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center bg-muted text-muted-foreground">
                  <ArchiveX className="h-6 w-6" aria-hidden="true" />
                </span>

                <h3 className="mt-5 text-lg font-black text-foreground">
                  {items.length === 0
                    ? "Your inventory is empty"
                    : "No matching household items found"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {items.length === 0
                    ? canEdit
                      ? "Start by adding pantry items, medicines, toiletries, cleaning products, stationery, or any other household essential."
                      : "Your family Owner or Editor has not added inventory items yet."
                    : "Try changing the search text, category, home zone, or status filter."}
                </p>

                {canEdit && items.length === 0 && (
                  <div className="mt-6 flex justify-center">
                    <AddInventoryItemDialog
                      familyId={familyId}
                      userId={userId}
                      onItemAdded={(item) => {
                        setItems((currentItems) => [item, ...currentItems]);
                      }}
                      triggerLabel="Add your first household item"
                      triggerIcon={<PackagePlus className="h-4 w-4" />}
                    />
                  </div>
                )}

                {items.length > 0 && hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="button-primary mt-6 h-11 px-5"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}