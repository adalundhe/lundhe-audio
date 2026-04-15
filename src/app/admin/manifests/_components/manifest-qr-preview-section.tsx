"use client";

import * as React from "react";
import { Loader2, Printer } from "lucide-react";

import { Button } from "~/components/ui/button";
import { type GearManifest } from "./manifest-manager-types";
import { printManifestQrCodes } from "./print-manifest-qr-codes";
import { useManifestQrCodes } from "./use-manifest-qr-codes";
import { type GearManifestQrPart } from "~/lib/gear-manifests/qr";

export function ManifestQrPreviewSection({
  manifest,
  parts,
}: {
  manifest: GearManifest | null;
  parts: GearManifestQrPart[];
}) {
  const { images, isLoading, error } = useManifestQrCodes(parts);

  if (!manifest) {
    return (
      <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        Select a saved manifest to preview and print its QR codes.
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight">{manifest.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {manifest.entries.length} item{manifest.entries.length === 1 ? "" : "s"} across{" "}
            {parts.length} QR part{parts.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            printManifestQrCodes({
              images,
              parts,
            })
          }
          disabled={isLoading || images.length === 0}
        >
          <Printer className="mr-2 !h-[16px] !w-[16px]" />
          Print Codes
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-md border text-sm text-muted-foreground">
          <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
          Generating QR codes...
        </div>
      ) : (
        <div className="flex min-w-0 flex-col divide-y rounded-md border">
          {parts.map((part, index) => (
            <div
              key={`${part.m}-${part.p}`}
              className="flex min-w-0 flex-col gap-4 px-5 py-5"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">
                  Part {part.p} of {part.c}
                </span>
                <span className="text-muted-foreground">
                  {part.e.length} row{part.e.length === 1 ? "" : "s"}
                </span>
              </div>
              {images[index] ? (
                <img
                  src={images[index]}
                  alt={`Manifest QR ${part.p} of ${part.c}`}
                  className="mx-auto aspect-square w-full max-w-72 rounded-md border bg-black object-contain"
                />
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
