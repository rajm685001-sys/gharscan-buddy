"use client";

import {
  AlertCircle,
  Check,
  ImagePlus,
  Loader2,
  PackagePlus,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";

import {
  categoryGroups,
  categoryOptions,
  locationOptions,
  unitOptions,
} from "@/lib/inventory";
import { createClient } from "@/lib/supabase/client";
import type {
  InventoryCategory,
  InventoryItem,
  InventoryUnit,
  StorageLocation,
} from "@/types/inventory";

type AddInventoryItemDialogProps = {
  familyId: string;
  userId: string;
  onItemAdded: (item: InventoryItem) => void;
  triggerLabel?: string;
  triggerIcon?: ReactNode;
};

const initialForm = {
  name: "",
  brand: "",
  category: "food" as InventoryCategory,
  storageLocation: "pantry" as StorageLocation,
  quantity: "1",
  unit: "piece" as InventoryUnit,
  minimumQuantity: "0",
  purchaseDate: "",
  expiryDate: "",
  price: "",
  notes: "",
};

export function AddInventoryItemDialog({
  familyId,
  userId,
  onItemAdded,
  triggerLabel = "Add item",
  triggerIcon,
}: AddInventoryItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetDrawer() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm(initialForm);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage("");
    setIsSubmitting(false);
  }

  function closeDrawer() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    resetDrawer();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!supportedTypes.includes(file.type)) {
      setErrorMessage("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be smaller than 5 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setErrorMessage("");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function removeSelectedImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedFile(null);
  }

  async function uploadImage(file: File) {
    const supabase = createClient();

    const safeFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");

    const imagePath = `${familyId}/${userId}/${Date.now()}-${safeFileName}`;

    const { error } = await supabase.storage
      .from("inventory-images")
      .upload(imagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      throw new Error(error.message);
    }

    return imagePath;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Item name is required.");
      return;
    }

    if (Number(form.quantity) < 0 || Number(form.minimumQuantity) < 0) {
      setErrorMessage("Quantity values cannot be negative.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imagePath: string | null = null;

      if (selectedFile) {
        imagePath = await uploadImage(selectedFile);
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from("inventory_items")
        .insert({
          family_id: familyId,
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          category: form.category,
          storage_location: form.storageLocation,
          quantity: Number(form.quantity),
          unit: form.unit,
          minimum_quantity: Number(form.minimumQuantity),
          purchase_date: form.purchaseDate || null,
          expiry_date: form.expiryDate || null,
          price: form.price ? Number(form.price) : null,
          notes: form.notes.trim() || null,
          image_path: imagePath,
          created_by: userId,
          updated_by: userId,
        })
        .select()
        .single();

      if (error) {
        if (imagePath) {
          await supabase.storage.from("inventory-images").remove([imagePath]);
        }

        throw new Error(error.message);
      }

      onItemAdded(data as InventoryItem);
      setIsOpen(false);
      resetDrawer();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to add item. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/25"
      >
        {triggerIcon ?? <PackagePlus className="h-4 w-4" />}
        <span>{triggerLabel}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-item-title"
        >
          <button
            type="button"
            onClick={closeDrawer}
            disabled={isSubmitting}
            aria-label="Close add item drawer"
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <aside className="fixed inset-0 z-[101] flex h-[100dvh] w-[100dvw] flex-col overflow-hidden bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  Inventory
                </p>
                <h2
                  id="add-item-title"
                  className="mt-1 text-xl font-black text-foreground"
                >
                  Add a home item
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                disabled={isSubmitting}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close add item drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
                {errorMessage && (
                  <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Item name <span className="text-red-500">*</span>
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
                      placeholder="Example: Amul Taaza Milk"
                      required
                      maxLength={120}
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Brand
                    </span>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          brand: event.target.value,
                        }))
                      }
                      placeholder="Example: Amul"
                      maxLength={80}
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
  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
>
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
                    <span className="text-sm font-bold text-foreground">
                      Storage location
                    </span>
                    <select
                      value={form.storageLocation}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          storageLocation: event.target
                            .value as StorageLocation,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    >
                      {locationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Quantity <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                      min="0"
                      step="0.01"
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
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
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
                      Low-stock threshold
                    </span>
                    <input
                      type="number"
                      value={form.minimumQuantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          minimumQuantity: event.target.value,
                        }))
                      }
                      min="0"
                      step="0.01"
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Purchase date
                    </span>
                    <input
                      type="date"
                      value={form.purchaseDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          purchaseDate: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Expiry / best-before date
                    </span>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          expiryDate: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Price (₹)
                    </span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      className="h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <div className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Item image
                    </span>

                    {previewUrl ? (
                      <div className="relative overflow-hidden rounded-xl border border-input bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Selected item preview"
                          className="h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeSelectedImage}
                          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white transition hover:bg-red-600"
                          aria-label="Remove selected image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/40 p-4 text-center transition hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                        <ImagePlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="mt-2 text-xs font-bold text-foreground">
                          Upload a product photo
                        </span>
                        <span className="mt-1 text-[11px] text-muted-foreground">
                          JPG, PNG, or WebP · Maximum 5 MB
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    )}
                  </div>

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
                      placeholder="Example: Keep chilled after opening"
                      maxLength={1000}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border bg-card p-5 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeDrawer}
                  disabled={isSubmitting}
                  className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-sm font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving item...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save item
                    </>
                  )}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}