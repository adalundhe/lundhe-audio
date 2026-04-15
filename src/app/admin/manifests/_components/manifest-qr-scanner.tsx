"use client";

import * as React from "react";
import { Camera, ImagePlus, Loader2, ScanLine, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { detectQrCodeFromSource } from "./manifest-qr-detection";

export function ManifestQrScanner({
  onPayloadDetected,
}: {
  onPayloadDetected: (rawValue: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const captureCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = React.useRef<number | null>(null);
  const isDetectingRef = React.useRef(false);
  const lastScanAtRef = React.useRef(0);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [isStartingCamera, setIsStartingCamera] = React.useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = React.useState(false);
  const [scannerError, setScannerError] = React.useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = React.useState<
    "idle" | "starting" | "scanning" | "detected"
  >("idle");

  const stopCamera = React.useCallback(() => {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    isDetectingRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    lastScanAtRef.current = 0;

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.pause();
      videoElement.srcObject = null;
    }

    setScannerStatus("idle");
    setIsCameraOpen(false);
  }, []);

  React.useEffect(() => stopCamera, [stopCamera]);

  React.useEffect(() => {
    if (!isCameraOpen) {
      return;
    }

    const stream = streamRef.current;
    const videoElement = videoRef.current;

    if (!stream || !videoElement) {
      return;
    }

    let cancelled = false;

    const attachStream = async () => {
      try {
        videoElement.srcObject = stream;
        await videoElement.play();
      } catch (cause) {
        if (!cancelled) {
          setScannerError(
            cause instanceof Error
              ? cause.message
              : "Unable to display the camera preview.",
          );
        }
      }
    };

    void attachStream();

    return () => {
      cancelled = true;
    };
  }, [isCameraOpen]);

  React.useEffect(() => {
    if (!isCameraOpen) {
      return;
    }

    const scanCameraFrame = async () => {
      if (isDetectingRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = captureCanvasRef.current;

      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return;
      }

      isDetectingRef.current = true;

      try {
        setScannerStatus("scanning");
        const rawValue = await detectQrCodeFromSource({
          source: video,
          canvas,
        });

        if (rawValue && Date.now() - lastScanAtRef.current > 1200) {
          lastScanAtRef.current = Date.now();
          setScannerError(null);
          setScannerStatus("detected");
          onPayloadDetected(rawValue);
        }
      } catch (cause) {
        setScannerError(
          cause instanceof Error ? cause.message : "Unable to scan the camera feed.",
        );
      } finally {
        isDetectingRef.current = false;
      }
    };

    scanIntervalRef.current = window.setInterval(() => {
      void scanCameraFrame();
    }, 250);

    return () => {
      if (scanIntervalRef.current !== null) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      isDetectingRef.current = false;
    };
  }, [isCameraOpen, onPayloadDetected]);

  const detectFromSource = React.useCallback(
    async (source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement) => {
      const canvas =
        captureCanvasRef.current ?? document.createElement("canvas");
      const nextRawValue = await detectQrCodeFromSource({
        source,
        canvas,
      });

      if (!nextRawValue) {
        setScannerError("No QR code was found.");
        return;
      }

      setScannerError(null);
      setScannerStatus("detected");
      onPayloadDetected(nextRawValue);
    },
    [onPayloadDetected],
  );

  const startCamera = React.useCallback(async () => {
    setIsStartingCamera(true);
    setScannerError(null);
    setScannerStatus("starting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not available in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;
      lastScanAtRef.current = 0;
      setIsCameraOpen(true);
    } catch (cause) {
      stopCamera();
      setScannerError(
        cause instanceof Error
          ? cause.message
          : "Unable to open the camera right now.",
      );
    } finally {
      setIsStartingCamera(false);
    }
  }, [onPayloadDetected, stopCamera]);

  const handleFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const [file] = Array.from(event.target.files ?? []);
      event.currentTarget.value = "";

      if (!file) {
        return;
      }

      setIsProcessingUpload(true);
      setScannerError(null);

      try {
        const imageBitmap = await createImageBitmap(file);
        await detectFromSource(imageBitmap);
        imageBitmap.close();
      } catch (cause) {
        setScannerError(
          cause instanceof Error
            ? cause.message
            : "Unable to scan the selected image.",
        );
      } finally {
        setIsProcessingUpload(false);
      }
    },
    [detectFromSource],
  );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <canvas ref={captureCanvasRef} className="hidden" />

      <div className="flex flex-wrap gap-2">
        {isCameraOpen ? (
          <Button type="button" variant="outline" size="sm" onClick={stopCamera}>
            <X className="mr-2 !h-[16px] !w-[16px]" />
            Stop Camera
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void startCamera()}
            disabled={isStartingCamera}
          >
            {isStartingCamera ? (
              <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
            ) : (
              <Camera className="mr-2 !h-[16px] !w-[16px]" />
            )}
            Scan With Camera
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isProcessingUpload}
        >
          {isProcessingUpload ? (
            <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
          ) : (
            <ImagePlus className="mr-2 !h-[16px] !w-[16px]" />
          )}
          Upload Image
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {isCameraOpen ? (
        <div className="overflow-hidden rounded-md border bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2 text-center">
            <ScanLine className="!h-[16px] !w-[16px]" />
            Scan a manifest QR with the camera, or upload an image.
          </div>
        </div>
      )}

      {isCameraOpen ? (
        <div className="text-sm text-muted-foreground">
          {scannerStatus === "detected"
            ? "QR code detected. Keep scanning or stop the camera."
            : "Live scan is active. Hold a manifest QR steady in frame."}
        </div>
      ) : null}

      {scannerError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {scannerError}
        </div>
      ) : null}
    </div>
  );
}
