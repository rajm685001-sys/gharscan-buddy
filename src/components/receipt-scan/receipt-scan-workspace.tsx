"use client";

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useState } from "react";

type ReceiptItem = {
  name: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  expiryDate: string;
};

type ReceiptScanResult = {
  storeName: string;
  receiptDate: string;
  receiptNumber: string;
  items: ReceiptItem[];
  subtotal: string;
  tax: string;
  total: string;
  confidence: number;
  warnings: string[];
};

export function ReceiptScanWorkspace({ userId }: { userId: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!supportedTypes.includes(file.type)) {
      setErrorMessage("Please choose a JPG, PNG, or WebP receipt image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Receipt image must be smaller than 5 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setErrorMessage("");
    setResult(null);
    setSavedCount(0);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    event.target.value = "";
  }

  function resetScanner() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage("");
    setSavedCount(0);
  }

  function updateResult<Key extends keyof ReceiptScanResult>(
    key: Key,
    value: ReceiptScanResult[Key],
  ) {
    setResult((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  function updateItem(
    index: number,
    key: keyof ReceiptItem,
    value: string,
  ) {
    setResult((current) => {
      if (!current) {
        return current;
      }

      const items = [...current.items];
      items[index] = { ...items[index], [key]: value };

      return { ...current, items };
    });
  }

  function removeItem(index: number) {
    setResult((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
  }

  function addItem() {
    setResult((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            name: "",
            quantity: "1",
            unitPrice: "",
            totalPrice: "",
            expiryDate: "",
          },
        ],
      };
    });
  }

  async function scanReceipt() {
    if (!selectedFile) {
      setErrorMessage("Choose or capture a receipt image first.");
      return;
    }

    setIsScanning(true);
    setErrorMessage("");
    setResult(null);
    setSavedCount(0);

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        result?: {
          storeName?: string;
          purchaseDate?: string;
          receiptTotal?: string;
          items?: {
            name?: string;
            quantity?: string | number;
            unitPrice?: string | number;
            lineTotal?: string | number;
            expiryDate?: string;
          }[];
          warnings?: string[];
        };
        error?: string;
      };

      if (!response.ok || !data.result) {
        throw new Error(
          data.error ??
            "Unable to scan this receipt. Try a clearer, well-lit image.",
        );
      }

      const scannedItems = (data.result.items ?? []).map((item) => ({
        name: item.name ?? "",
        quantity: String(item.quantity ?? "1"),
        unitPrice: String(item.unitPrice ?? ""),
        totalPrice: String(item.lineTotal ?? ""),
        expiryDate: item.expiryDate ?? "",
      }));

      setResult({
        storeName: data.result.storeName ?? "",
        receiptDate: data.result.purchaseDate ?? "",
        receiptNumber: "",
        items: scannedItems,
        subtotal: "",
        tax: "",
        total: data.result.receiptTotal ?? "",
        confidence: 0,
        warnings: data.result.warnings ?? [],
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to scan the receipt image.",
      );
    } finally {
      setIsScanning(false);
    }
  }

  async function saveReceiptItems() {
    if (!result || result.items.length === 0) {
      setErrorMessage("Add at least one item before saving.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/receipt-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          storeName: result.storeName,
          receiptDate: result.receiptDate,
          items: result.items,
        }),
      });

      const data = (await response.json()) as {
        savedCount?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error ?? "Unable to save receipt items to inventory.",
        );
      }

      setSavedCount(data.savedCount ?? 0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save receipt items.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <header className="border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                <ReceiptText className="h-4 w-4" aria-hidden="true" />
                Receipt scanner
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                Scan a shopping receipt
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Upload one clear receipt image. Add expiry dates for perishable
                items, review everything, then save them to inventory.
              </p>
            </div>

            <Link href="/inventory" className="button-secondary h-11">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to inventory
            </Link>
          </div>
        </header>

        {errorMessage ? (
          <div className="mt-6 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />

            <p>{errorMessage}</p>
          </div>
        ) : null}

        {savedCount > 0 ? (
          <div className="mt-6 border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200">
            {savedCount} item(s) saved to inventory.
          </div>
        ) : null}

        <section className="mt-7 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="border border-border bg-card p-5 shadow-sm sm:p-7">
            <h2 className="font-black text-foreground">Receipt image</h2>

            {previewUrl ? (
              <div className="relative mt-5 overflow-hidden border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected receipt"
                  className="max-h-96 w-full object-contain"
                />

                <button
                  type="button"
                  onClick={resetScanner}
                  className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center bg-slate-950/75 text-white transition hover:bg-red-600"
                  aria-label="Remove receipt image"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="mt-5 grid min-h-72 place-items-center border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-950 dark:bg-emerald-950/20">
                <div>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center bg-emerald-600 text-white">
                    <Camera className="h-7 w-7" aria-hidden="true" />
                  </span>

                  <p className="mt-4 font-black text-foreground">
                    Upload a receipt photo
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Include the store name, item lines, prices, and total.
                  </p>
                </div>
              </div>
            )}

            <label className="button-secondary mt-5 h-12 cursor-pointer px-5">
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
              Choose receipt image

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={scanReceipt}
              disabled={!selectedFile || isScanning}
              className="button-primary mt-3 h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  Reading receipt… This can take 10–30 seconds.
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Scan receipt
                </>
              )}
            </button>
          </article>

          <article className="border border-border bg-card p-5 shadow-sm sm:p-7">
            <h2 className="font-black text-foreground">Extracted items</h2>

            {!result ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Scan a receipt to review its items before saving.
              </p>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Store name
                    </span>

                    <input
                      value={result.storeName}
                      onChange={(event) =>
                        updateResult("storeName", event.target.value)
                      }
                      className="h-11 w-full border border-input bg-background px-3 text-sm"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Receipt date
                    </span>

                    <input
                      type="date"
                      value={result.receiptDate}
                      onChange={(event) =>
                        updateResult("receiptDate", event.target.value)
                      }
                      className="h-11 w-full border border-input bg-background px-3 text-sm"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  {result.items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-foreground">
                          Item {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="inline-flex h-9 w-9 items-center justify-center text-red-600 transition hover:bg-red-50"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      <input
                        value={item.name}
                        onChange={(event) =>
                          updateItem(index, "name", event.target.value)
                        }
                        placeholder="Item name"
                        className="mt-3 h-11 w-full border border-input bg-background px-3 text-sm"
                      />

                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <input
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, "quantity", event.target.value)
                          }
                          placeholder="Qty"
                          className="h-11 w-full border border-input bg-background px-3 text-sm"
                        />

                        <input
                          value={item.unitPrice}
                          onChange={(event) =>
                            updateItem(index, "unitPrice", event.target.value)
                          }
                          placeholder="Unit ₹"
                          className="h-11 w-full border border-input bg-background px-3 text-sm"
                        />

                        <input
                          value={item.totalPrice}
                          onChange={(event) =>
                            updateItem(index, "totalPrice", event.target.value)
                          }
                          placeholder="Total ₹"
                          className="h-11 w-full border border-input bg-background px-3 text-sm"
                        />
                      </div>

                      <label className="mt-3 block">
                        <span className="text-xs font-bold text-muted-foreground">
                          Expiry date (optional)
                        </span>

                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(event) =>
                            updateItem(index, "expiryDate", event.target.value)
                          }
                          className="mt-1 h-11 w-full border border-input bg-background px-3 text-sm"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addItem}
                  className="button-secondary h-11 w-full"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add item manually
                </button>

                <button
                  type="button"
                  onClick={saveReceiptItems}
                  disabled={isSaving || result.items.length === 0}
                  className="button-primary h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Saving items…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Save items to inventory
                    </>
                  )}
                </button>
              </div>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}