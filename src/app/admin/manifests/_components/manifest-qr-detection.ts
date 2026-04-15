"use client";

import type jsQR from "jsqr";

export type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect: (
    source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement,
  ) => Promise<BarcodeDetectorResult[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

export type QrImageSource = HTMLVideoElement | ImageBitmap | HTMLCanvasElement;

let jsQrLoader: Promise<typeof jsQR> | null = null;

const getJsQr = async () => {
  jsQrLoader ??= import("jsqr").then((module) => module.default);
  return jsQrLoader;
};

export const getQrDetector = () => {
  if (typeof window === "undefined" || !window.BarcodeDetector) {
    return null;
  }

  return new window.BarcodeDetector({ formats: ["qr_code"] });
};

export const readSourceDimensions = (source: QrImageSource) => {
  if (source instanceof HTMLVideoElement) {
    return {
      width: source.videoWidth,
      height: source.videoHeight,
    };
  }

  if (source instanceof ImageBitmap) {
    return {
      width: source.width,
      height: source.height,
    };
  }

  return {
    width: source.width,
    height: source.height,
  };
};

export const drawSourceToCanvas = ({
  source,
  canvas,
  maxDimension = 1400,
}: {
  source: QrImageSource;
  canvas: HTMLCanvasElement;
  maxDimension?: number;
}) => {
  const { width, height } = readSourceDimensions(source);

  if (width <= 0 || height <= 0) {
    return false;
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));

  if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
  }

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return false;
  }

  context.drawImage(source, 0, 0, nextWidth, nextHeight);
  return true;
};

export const detectQrCodeFromSource = async ({
  source,
  canvas,
}: {
  source: QrImageSource;
  canvas: HTMLCanvasElement;
}) => {
  if (!drawSourceToCanvas({ source, canvas })) {
    return null;
  }

  const detector = getQrDetector();
  const barcodes = detector ? await detector.detect(canvas) : [];
  const barcodeValue = barcodes.find((barcode) => barcode.rawValue?.trim())?.rawValue;

  if (barcodeValue) {
    return barcodeValue;
  }

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return null;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const decoder = await getJsQr();
  return decoder(imageData.data, canvas.width, canvas.height)?.data ?? null;
};
