"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { type GearManifest } from "./manifest-manager-types";
import { ManifestQrPreviewSection } from "./manifest-qr-preview-section";
import { type GearManifestQrPart } from "~/lib/gear-manifests/qr";

export function ManifestQrPreviewDialog({
  open,
  onOpenChange,
  manifest,
  parts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manifest: GearManifest | null;
  parts: GearManifestQrPart[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manifest QR Codes</DialogTitle>
          <DialogDescription>
            Review and print the generated QR parts, then close the modal to return
            to the manifests page.
          </DialogDescription>
        </DialogHeader>

        <ManifestQrPreviewSection manifest={manifest} parts={parts} />
      </DialogContent>
    </Dialog>
  );
}
