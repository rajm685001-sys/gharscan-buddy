"use client";

import {
  Camera,
  CameraOff,
  Loader2,
  ScanBarcode,
  Sparkles,
  SwitchCamera,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type LiveCameraScannerProps = {
  onCaptured: (file: File, barcode: string) => void;
  onCancel: () => void;
};

type BarcodeDetectorLike = {
  detect: (
    source: HTMLVideoElement,
  ) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

export function LiveCameraScanner({
  onCaptured,
  onCancel,
}: LiveCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const detectionTimerRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState("");
  const [isStarting, setIsStarting] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] =
    useState<"environment" | "user">("environment");
  const [detectedBarcode, setDetectedBarcode] = useState("");
  const [barcodeSupported, setBarcodeSupported] = useState(false);

  function stopCamera() {
    if (detectionTimerRef.current) {
      window.clearInterval(detectionTimerRef.current);
      detectionTimerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      setIsStarting(true);
      setCameraError("");

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera access is not supported in this browser. Use a recent Chrome, Edge, or Safari browser.",
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: cameraFacingMode,
            },
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;

        if (!video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
            return;
          }

          video.onloadedmetadata = () => resolve();
        });

        if (!isMounted || videoRef.current !== video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        try {
          await video.play();
        } catch (playError) {
          if (isMounted) {
            console.warn("Camera preview play was interrupted:", playError);
          }
        }

        if ("BarcodeDetector" in window && window.BarcodeDetector) {
          try {
            detectorRef.current = new window.BarcodeDetector({
              formats: [
                "ean_13",
                "ean_8",
                "upc_a",
                "upc_e",
                "code_128",
                "code_39",
                "qr_code",
              ],
            });

            if (isMounted) {
              setBarcodeSupported(true);
            }
          } catch {
            if (isMounted) {
              setBarcodeSupported(false);
            }
          }
        } else if (isMounted) {
          setBarcodeSupported(false);
        }
      } catch (error) {
        if (isMounted) {
          setCameraError(
            error instanceof Error
              ? error.message
              : "Unable to open camera. Check browser permission and try again.",
          );
        }
      } finally {
        if (isMounted) {
          setIsStarting(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [cameraFacingMode]);

  useEffect(() => {
    if (!barcodeSupported || !detectorRef.current) {
      return;
    }

    detectionTimerRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;

      if (
        !video ||
        !detector ||
        video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA
      ) {
        return;
      }

      try {
        const barcodes = await detector.detect(video);
        const firstBarcode = barcodes[0]?.rawValue?.trim();

        if (firstBarcode) {
          setDetectedBarcode(firstBarcode);
        }
      } catch {
        // Local barcode recognition is optional. Gemini image scanning still works.
      }
    }, 850);

    return () => {
      if (detectionTimerRef.current) {
        window.clearInterval(detectionTimerRef.current);
        detectionTimerRef.current = null;
      }
    };
  }, [barcodeSupported]);

  async function captureFrame() {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is still loading. Please wait one moment.");
      return;
    }

    setIsCapturing(true);
    setCameraError("");

    try {
      const canvas = document.createElement("canvas");
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / video.videoWidth);

      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture the camera frame.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.9);
      });

      if (!blob) {
        throw new Error("Unable to create an image from the camera frame.");
      }

      const file = new File(
        [blob],
        `live-product-scan-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        },
      );

      stopCamera();
      onCaptured(file, detectedBarcode);
    } catch (error) {
      setCameraError(
        error instanceof Error
          ? error.message
          : "Unable to capture the product image.",
      );
    } finally {
      setIsCapturing(false);
    }
  }

  function switchCamera() {
    stopCamera();
    setDetectedBarcode("");
    setCameraFacingMode((currentMode) =>
      currentMode === "environment" ? "user" : "environment",
    );
  }

  function closeScanner() {
    stopCamera();
    onCancel();
  }

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950 text-white">
      <div className="relative flex h-[100dvh] flex-col">
        <header className="relative z-20 flex shrink-0 items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Live AI scanner
            </p>
            <h2 className="mt-1 text-lg font-black">
              Aim at the product label
            </h2>
          </div>

          <button
            type="button"
            onClick={closeScanner}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Close camera scanner"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {isStarting && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
              <div className="text-center">
                <Loader2 className="mx-auto h-9 w-9 animate-spin text-emerald-400" />
                <p className="mt-4 text-sm text-slate-300">
                  Opening camera...
                </p>
              </div>
            </div>
          )}

          {cameraError ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div className="max-w-md">
                <CameraOff className="mx-auto h-10 w-10 text-red-400" />
                <p className="mt-5 text-lg font-black">
                  Camera unavailable
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={closeScanner}
                  className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950"
                >
                  Return to scanner
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="h-full w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5">
                <div className="relative h-[58%] w-full max-w-xl rounded-[2rem] border-2 border-emerald-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]">
                  <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-[1.8rem] border-l-4 border-t-4 border-emerald-300" />
                  <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-[1.8rem] border-r-4 border-t-4 border-emerald-300" />
                  <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-[1.8rem] border-b-4 border-l-4 border-emerald-300" />
                  <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-[1.8rem] border-b-4 border-r-4 border-emerald-300" />
                  <span className="absolute left-4 right-4 top-1/2 h-px bg-emerald-300/80 shadow-[0_0_16px_rgba(110,231,183,.9)]" />
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="relative z-20 shrink-0 bg-slate-950/90 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:px-6">
          {barcodeSupported ? (
            <div className="mx-auto mb-4 flex max-w-xl items-center justify-center gap-2 text-center text-xs text-slate-300">
              <ScanBarcode className="h-4 w-4 text-emerald-400" />
              {detectedBarcode
                ? `Barcode detected: ${detectedBarcode}`
                : "Searching for a barcode automatically..."}
            </div>
          ) : (
            <p className="mb-4 text-center text-xs text-slate-400">
              Barcode detection is unavailable in this browser. AI label
              scanning will still work.
            </p>
          )}

          <div className="mx-auto flex max-w-xl items-center justify-center gap-4">
            <button
              type="button"
              onClick={switchCamera}
              disabled={isStarting || Boolean(cameraError)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={captureFrame}
              disabled={isStarting || Boolean(cameraError) || isCapturing}
              className="inline-flex h-16 min-w-56 items-center justify-center gap-3 rounded-full bg-emerald-500 px-7 text-sm font-black text-emerald-950 shadow-xl shadow-emerald-500/20 transition hover:scale-[1.02] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  Capture & analyze
                </>
              )}
            </button>
          </div>

          <p className="mx-auto mt-4 max-w-xl pb-2 text-center text-xs leading-5 text-slate-400">
            Keep the product name, expiry date, quantity, and barcode inside
            the frame. You will review every AI-extracted field before saving.
          </p>
        </footer>
      </div>
    </div>
  );
}