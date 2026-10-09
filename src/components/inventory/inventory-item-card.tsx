"use client";

import {
  CalendarClock,
  Check,
  EllipsisVertical,
  MapPin,
  Package,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  formatDate,
  formatQuantity,
  getCategoryMeta,
  getInventoryStatus,
  getLocationLabel,
  getStatusMeta,
} from "@/lib/inventory";
import { getInventoryImageUrl } from "@/lib/inventory-images";
import type { InventoryItem } from "@/types/inventory";

type InventoryItemCardProps = {
  item: InventoryItem;
  viewMode: "grid" | "list";
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (item: InventoryItem) => void;
  onConsume: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
};

export function InventoryItemCard({
  item,
  viewMode,
  canEdit,
  canDelete,
  onEdit,
  onConsume,
  onDelete,
}: InventoryItemCardProps) {
  const category = getCategoryMeta(item.category);
  const status = getStatusMeta(getInventoryStatus(item));

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadImage() {
      const url = await getInventoryImageUrl(item.image_path);

      if (active) {
        setImageUrl(url);
      }
    }

    loadImage();

    return () => {
      active = false;
    };
  }, [item.image_path]);

  function closeMenu() {
    setMenuOpen(false);
  }

  function itemVisual(className: string) {
    if (imageUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={item.name} className={className} />
      );
    }

    return (
      <span className="flex h-full w-full items-center justify-center text-4xl">
        {category.emoji}
      </span>
    );
  }

  function renderActionMenu() {
    if (!canEdit && !canDelete) {
      return null;
    }

    return (
      <div className="relative z-50 shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
          aria-label={`Open actions for ${item.name}`}
          aria-expanded={menuOpen}
        >
          <EllipsisVertical className="h-5 w-5" />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label="Close item action menu"
              onClick={closeMenu}
              className="fixed inset-0 z-[60] cursor-default"
            />

            <div className="absolute right-0 top-12 z-[70] w-48 overflow-hidden rounded-2xl border border-border bg-card py-1.5 shadow-2xl shadow-slate-950/20">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onEdit(item);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-foreground transition hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Edit item
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onConsume(item);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-foreground transition hover:bg-muted"
                  >
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Consume / finish
                  </button>
                </>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    onDelete(item);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete item
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <article className="relative z-0 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:z-10 hover:border-emerald-300 hover:shadow-lg dark:hover:border-emerald-800 sm:flex-row sm:items-center">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-muted">
          {itemVisual("h-full w-full object-cover")}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black text-foreground">
              {item.name}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}
            >
              {status.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {item.brand ? `${item.brand} · ` : ""}
            {formatQuantity(item)} · {getLocationLabel(item.storage_location)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground sm:text-right">
          <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Expiry: {formatDate(item.expiry_date)}</span>
        </div>

        {renderActionMenu()}
      </article>
    );
  }

  return (
    <article className="relative z-0 rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5 dark:hover:border-emerald-800">
      <div className="h-36 overflow-hidden rounded-t-3xl bg-gradient-to-br from-muted to-emerald-50 dark:to-emerald-950/30">
        {itemVisual(
          "h-full w-full object-cover transition-transform duration-300 hover:scale-105",
        )}
      </div>

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {category.label}
            </p>
            <h3 className="mt-1 truncate text-lg font-black text-foreground">
              {item.name}
            </h3>
          </div>

          {renderActionMenu()}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {item.brand ? (
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              {item.brand}
            </p>
          ) : (
            <span />
          )}

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-foreground">
              {formatQuantity(item)}
            </span>
          </p>

          <p className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {getLocationLabel(item.storage_location)}
          </p>

          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Expiry: {formatDate(item.expiry_date)}
          </p>
        </div>

        {item.notes && (
          <div className="mt-4 flex gap-2 rounded-xl bg-muted/65 p-3 text-xs leading-5 text-muted-foreground">
            <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{item.notes}</p>
          </div>
        )}
      </div>
    </article>
  );
}