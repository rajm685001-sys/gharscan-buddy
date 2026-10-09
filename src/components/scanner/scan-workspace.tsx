"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  FileText,
  ImagePlus,
  Loader2,
  ScanBarcode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { LiveCameraScanner } from "@/components/scanner/live-camera-scanner";
import {
  categoryOptions,
  locationOptions,
  unitOptions,
} from "@/lib/inventory";
import { createClient } from "@/lib/supabase/client";
import type { AiScanResult } from "@/types/ai-scan";
import type {
  InventoryCategory,
  InventoryUnit,
  StorageLocation,
} from "@/types/inventory";

type ScanWorkspaceProps = {
  familyId: string;
  familyName: string;
  familyCode: string;
  userId: string;
  userRole: "owner" | "editor" | "viewer";
};

type ScanStage = "upload" | "analyzing" | "review" | "saved";

export function ScanWorkspace({
  familyId,
  familyName,
  familyCode,
  userId,
  userRole,
}: ScanWorkspaceProps) {
  const [stage, setStage] = useState<ScanStage>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedBarcode, setDetectedBarcode] = useState("");
  const [result, setResult] = useState<AiScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const canEdit = userRole === "owner" || userRole === "editor";

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function releasePreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }

  function resetScanner() {
    releasePreview();
    setStage("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectedBarcode("");
    setResult(null);
    setErrorMessage("");
    setIsSaving(false);
    setCameraOpen(false);
  }

  function selectImageFile(file: File, barcode = "") {
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!supportedTypes.includes(file.type)) {
      setErrorMessage("Please choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be smaller than 5 MB.");
      return;
    }

    releasePreview();
    setErrorMessage("");
    setResult(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetectedBarcode(barcode);
    setCameraOpen(false);
    setStage("upload");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    selectImageFile(file);
    event.target.value = "";
  }

  async function analyzeProduct() {
    if (!selectedFile) {
      setErrorMessage("Open the camera or choose a product image first.");
      return;
    }

    setErrorMessage("");
    setStage("analyzing");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("barcode", detectedBarcode);

      const response = await fetch("/api/scan-product", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        result?: AiScanResult;
        error?: string;
      };

      if (!response.ok || !data.result) {
        throw new Error(
          data.error ??
            "Unable to analyze this product. Try a closer and brighter image.",
        );
      }

      setResult(data.result);
      setStage("review");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to analyze the product image.",
      );
      setStage("upload");
    }
  }

  function updateResult<Key extends keyof AiScanResult>(
    key: Key,
    value: AiScanResult[Key],
  ) {
    setResult((currentResult) =>
      currentResult ? { ...currentResult, [key]: value } : currentResult,
    );
  }

  async function uploadScannedImage(file: File) {
    const supabase = createClient();

    const safeFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");

    const imagePath = `${familyId}/${userId}/ai-scan-${Date.now()}-${safeFileName}`;

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

  async function saveToInventory() {
    if (!result || !canEdit) {
      return;
    }

    if (!result.name.trim()) {
      setErrorMessage("Item name is required before saving.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    let imagePath: string | null = null;

    try {
      if (selectedFile) {
        imagePath = await uploadScannedImage(selectedFile);
      }

      const combinedNotes = [
        result.notes.trim(),
        result.barcode ? `Barcode: ${result.barcode}` : "",
        result.batchNumber ? `Batch: ${result.batchNumber}` : "",
        result.manufactureDate
          ? `Manufactured: ${result.manufactureDate}`
          : "",
        result.warnings.length > 0
          ? `AI scan warnings: ${result.warnings.join(" | ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const supabase = createClient();

      const { error } = await supabase.from("inventory_items").insert({
        family_id: familyId,
        name: result.name.trim(),
        brand: result.brand.trim() || null,
        category: result.category,
        storage_location: result.storageLocation,
        quantity: Number(result.quantity) || 1,
        unit: result.unit,
        minimum_quantity: 0,
        purchase_date: result.purchaseDate || null,
        expiry_date: result.expiryDate || null,
        price: result.price ? Number(result.price) : null,
        notes: combinedNotes || null,
        image_path: imagePath,
        created_by: userId,
        updated_by: userId,
      });

      if (error) {
        if (imagePath) {
          await supabase.storage.from("inventory-images").remove([imagePath]);
        }

        throw new Error(error.message);
      }

      setStage("saved");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save the scanned item. Please try again.",
      );
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        familyName={familyName}
        familyCode={familyCode}
      />

      <main className="pb-24 lg:ml-72 lg:pb-8">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
          <header className="border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Product scanner
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  Scan a product live
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Open your camera, aim at a product label, capture one clear
                  frame, and let the scanner extract product details for you to
                  review.
                </p>
              </div>

              <Link href="/inventory" className="button-secondary h-11">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to inventory
              </Link>
            </div>
          </header>

          {!canEdit && (
            <div className="mt-6 flex gap-3 border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-950 dark:bg-sky-950/30 dark:text-sky-200">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <p>
                You have viewer access. You may explore scanning, but only an
                Owner or Editor can save scanned details into inventory.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-6 flex gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              <p>{errorMessage}</p>
            </div>
          )}

          {stage === "upload" && (
            <section className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <article className="border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <ScanLine className="h-5 w-5" aria-hidden="true" />
                  </span>

                  <div>
                    <h2 className="font-black text-foreground">
                      Camera-first product scanner
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Capture a clear label image for the best extraction result.
                    </p>
                  </div>
                </div>

                {previewUrl ? (
                  <div className="relative mt-6 overflow-hidden border border-border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Selected product image"
                      className="h-80 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={resetScanner}
                      className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center bg-slate-950/75 text-white transition hover:bg-red-600"
                      aria-label="Remove selected image"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {detectedBarcode && (
                      <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 border border-white/20 bg-slate-950/75 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                        <ScanBarcode
                          className="h-4 w-4 text-emerald-300"
                          aria-hidden="true"
                        />
                        Barcode: {detectedBarcode}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 grid min-h-80 place-items-center border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-950 dark:bg-emerald-950/20">
                    <div>
                      <span className="mx-auto flex h-16 w-16 items-center justify-center bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                        <Camera className="h-7 w-7" aria-hidden="true" />
                      </span>

                      <p className="mt-5 text-base font-black text-foreground">
                        Scan a product using your camera
                      </p>

                      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                        Position the product label, expiry text, and barcode
                        within the camera frame.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    className="button-primary h-12 px-5"
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Open live camera
                  </button>

                  <label className="button-secondary h-12 cursor-pointer px-5">
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    Upload image

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={analyzeProduct}
                  disabled={!selectedFile}
                  className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Analyze captured product
                </button>
              </article>

              <aside className="space-y-5">
                <article className="border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm font-black text-foreground">
                    Better scanning results
                  </p>

                  <div className="mt-5 space-y-4">
                    {[
                      {
                        icon: Camera,
                        title: "Use good lighting",
                        description:
                          "Avoid glare and keep the label sharp and readable.",
                      },
                      {
                        icon: ScanBarcode,
                        title: "Include key details",
                        description:
                          "Keep product name, expiry, quantity, and barcode in the frame.",
                      },
                      {
                        icon: ShieldCheck,
                        title: "Review before saving",
                        description:
                          "Extracted suggestions must be confirmed before inventory is updated.",
                      },
                    ].map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.title} className="flex gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted text-emerald-600 dark:text-emerald-400">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>

                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {item.title}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800 dark:border-amber-950 dark:bg-amber-950/25 dark:text-amber-200">
                  <p className="font-black">Usage note</p>

                  <p className="mt-2">
                    The scanner sends one captured frame for analysis instead
                    of sending continuous video. This keeps the workflow
                    practical and gives you control over what is submitted.
                  </p>
                </article>
              </aside>
            </section>
          )}

          {stage === "analyzing" && (
            <section className="mt-7 flex min-h-[480px] items-center justify-center border border-border bg-card p-6 shadow-sm">
              <div className="max-w-md text-center">
                <span className="mx-auto flex h-20 w-20 items-center justify-center bg-emerald-600 text-white shadow-xl shadow-emerald-600/30">
                  <Loader2 className="h-9 w-9 animate-spin" aria-hidden="true" />
                </span>

                <p className="mt-8 text-2xl font-black text-foreground">
                  Reading the product label
                </p>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Extracting product name, brand, category, quantity, expiry,
                  batch information, price, and visible barcode.
                </p>

                <div className="mt-7 h-2 overflow-hidden bg-muted">
                  <div className="h-full w-2/3 bg-emerald-500" />
                </div>
              </div>
            </section>
          )}

          {stage === "review" && result && (
            <section className="mt-7 grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
              <aside className="space-y-5">
                <article className="overflow-hidden border border-border bg-card shadow-sm">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Captured scanned product"
                      className="h-64 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center bg-muted text-muted-foreground">
                      No preview available
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />

                      <p className="text-sm font-black text-foreground">
                        Extraction complete
                      </p>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Confidence score:{" "}
                      <span className="font-black text-emerald-700 dark:text-emerald-400">
                        {result.confidence}%
                      </span>
                    </p>
                  </div>
                </article>

                {result.barcode && (
                  <article className="border border-border bg-card p-5 shadow-sm">
                    <p className="flex items-center gap-2 text-sm font-black text-foreground">
                      <ScanBarcode
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      Barcode
                    </p>

                    <p className="mt-3 break-all bg-muted px-3 py-2 font-mono text-sm font-bold text-foreground">
                      {result.barcode}
                    </p>
                  </article>
                )}

                {result.detectedText.length > 0 && (
                  <article className="border border-border bg-card p-5 shadow-sm">
                    <p className="flex items-center gap-2 text-sm font-black text-foreground">
                      <FileText
                        className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                      Detected label text
                    </p>

                    <div className="mt-4 space-y-2">
                      {result.detectedText.map((text) => (
                        <div
                          key={text}
                          className="bg-muted px-3 py-2 font-mono text-xs text-muted-foreground"
                        >
                          {text}
                        </div>
                      ))}
                    </div>
                  </article>
                )}

                {result.warnings.length > 0 && (
                  <article className="border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-950 dark:bg-amber-950/25">
                    <p className="flex items-center gap-2 text-sm font-black text-amber-800 dark:text-amber-200">
                      <AlertCircle
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      Review warnings
                    </p>

                    <ul className="mt-3 space-y-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
                      {result.warnings.map((warning) => (
                        <li key={warning}>• {warning}</li>
                      ))}
                    </ul>
                  </article>
                )}
              </aside>

              <article className="border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                      Review before saving
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-foreground">
                      Confirm extracted details
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Check and correct all information before it is saved into
                      your secure family inventory.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetScanner}
                    className="button-secondary h-10 px-3 text-muted-foreground"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Scan again
                  </button>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Item name
                    </span>

                    <input
                      type="text"
                      value={result.name}
                      onChange={(event) =>
                        updateResult("name", event.target.value)
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Brand
                    </span>

                    <input
                      type="text"
                      value={result.brand}
                      onChange={(event) =>
                        updateResult("brand", event.target.value)
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Category
                    </span>

                    <select
                      value={result.category}
                      onChange={(event) =>
                        updateResult(
                          "category",
                          event.target.value as InventoryCategory,
                        )
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
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
                      Storage location
                    </span>

                    <select
                      value={result.storageLocation}
                      onChange={(event) =>
                        updateResult(
                          "storageLocation",
                          event.target.value as StorageLocation,
                        )
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
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
                      Quantity
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={result.quantity}
                      onChange={(event) =>
                        updateResult("quantity", event.target.value)
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Unit
                    </span>

                    <select
                      value={result.unit}
                      onChange={(event) =>
                        updateResult(
                          "unit",
                          event.target.value as InventoryUnit,
                        )
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm font-semibold outline-none focus:border-emerald-500"
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
                      Expiry / best-before date
                    </span>

                    <input
                      type="date"
                      value={result.expiryDate}
                      onChange={(event) =>
                        updateResult("expiryDate", event.target.value)
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Price (₹)
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={result.price}
                      onChange={(event) =>
                        updateResult("price", event.target.value)
                      }
                      placeholder="Optional"
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Batch number
                    </span>

                    <input
                      type="text"
                      value={result.batchNumber}
                      onChange={(event) =>
                        updateResult("batchNumber", event.target.value)
                      }
                      placeholder="Optional"
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-bold text-foreground">
                      Manufacture date
                    </span>

                    <input
                      type="date"
                      value={result.manufactureDate}
                      onChange={(event) =>
                        updateResult("manufactureDate", event.target.value)
                      }
                      className="h-12 w-full border border-input bg-background px-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>

                  <label className="space-y-2 sm:col-span-2">
                    <span className="text-sm font-bold text-foreground">
                      Notes
                    </span>

                    <textarea
                      value={result.notes}
                      onChange={(event) =>
                        updateResult("notes", event.target.value)
                      }
                      rows={3}
                      className="w-full resize-none border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </label>
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetScanner}
                    disabled={isSaving}
                    className="button-secondary h-12 px-5 text-muted-foreground disabled:opacity-50"
                  >
                    Discard scan
                  </button>

                  <button
                    type="button"
                    onClick={saveToInventory}
                    disabled={isSaving || !canEdit}
                    className="button-primary h-12 px-5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Saving to inventory...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Confirm and save item
                      </>
                    )}
                  </button>
                </div>
              </article>
            </section>
          )}

          {stage === "saved" && (
            <section className="mt-7 flex min-h-[480px] items-center justify-center border border-border bg-card p-6 text-center shadow-sm">
              <div className="max-w-md">
                <span className="mx-auto flex h-20 w-20 items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Check className="h-10 w-10" aria-hidden="true" />
                </span>

                <h2 className="mt-7 text-3xl font-black text-foreground">
                  Scanned item saved
                </h2>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  The product is now stored in your family inventory. GharScan
                  Buddy will track its quantity, stock status, and expiry date.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/inventory"
                    className="button-primary h-12 px-5"
                  >
                    View inventory
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  <button
                    type="button"
                    onClick={resetScanner}
                    className="button-secondary h-12 px-5"
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Scan another item
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {cameraOpen && (
        <LiveCameraScanner
          onCaptured={(file, barcode) => selectImageFile(file, barcode)}
          onCancel={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}