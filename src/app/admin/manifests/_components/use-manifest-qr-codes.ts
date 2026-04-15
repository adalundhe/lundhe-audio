"use client";

import * as React from "react";

import {
  type GearManifestQrPart,
  serializeGearManifestQrPart,
} from "~/lib/gear-manifests/qr";

export function useManifestQrCodes(parts: GearManifestQrPart[]) {
  const [images, setImages] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (parts.length === 0) {
        setImages([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const qrCode = await import("qrcode");
        const nextImages = await Promise.all(
          parts.map((part) =>
            qrCode.toDataURL(serializeGearManifestQrPart(part), {
              errorCorrectionLevel: "M",
              margin: 1,
              width: 512,
              color: {
                dark: "#f5f5f5",
                light: "#000000",
              },
            }),
          ),
        );

        if (!cancelled) {
          setImages(nextImages);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to generate QR codes right now.",
          );
          setImages([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [parts]);

  return {
    images,
    isLoading,
    error,
  };
}
