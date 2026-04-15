"use client";

import * as React from "react";

import { AdminDataTable } from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import { SectionAccordionCard } from "~/app/admin/gear/_components/section-accordion-card";
import { type ManifestGearItem } from "./manifest-manager-types";
import { ManifestQrScanner } from "./manifest-qr-scanner";
import { useManifestGearTableConfig } from "./manifest-gear-table-config";

export function ManifestScanSection({
  onPayloadDetected,
  onClear,
  manifestName,
  partCount,
  scannedPartCount,
  missingPartIndexes,
  scanError,
  scannedGear,
  missingScannedGearIds,
}: {
  onPayloadDetected: (rawValue: string) => void;
  onClear: () => void;
  manifestName: string;
  partCount: number;
  scannedPartCount: number;
  missingPartIndexes: number[];
  scanError: string | null;
  scannedGear: ManifestGearItem[];
  missingScannedGearIds: string[];
}) {
  const { columns, filterTabs } = useManifestGearTableConfig({
    gear: scannedGear,
  });

  return (
    <SectionAccordionCard
      value="scan"
      title="Scan Manifest"
      description="Scan QR parts from the camera or an uploaded image, then inspect the resolved inventory rows below."
      contentClassName="min-w-0 px-0"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <ManifestQrScanner onPayloadDetected={onPayloadDetected} />

        <div className="flex flex-col gap-2 rounded-md border px-4 py-3 text-sm">
          <div className="font-medium">
            {manifestName
              ? `Manifest: ${manifestName}`
              : "No manifest parts scanned yet."}
          </div>
          {partCount > 0 ? (
            <div className="text-muted-foreground">
              {scannedPartCount} of {partCount} part
              {partCount === 1 ? "" : "s"} scanned
              {missingPartIndexes.length > 0
                ? ` · Missing ${missingPartIndexes.join(", ")}`
                : " · Complete"}
            </div>
          ) : null}
          {scanError ? <div className="text-destructive">{scanError}</div> : null}
          {missingScannedGearIds.length > 0 ? (
            <div className="text-destructive">
              Missing inventory rows for: {missingScannedGearIds.join(", ")}
            </div>
          ) : null}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              disabled={partCount === 0}
            >
              Clear Scan
            </Button>
          </div>
        </div>

        <AdminDataTable
          data={scannedGear}
          columns={columns}
          footerControlsLayout="stacked-mobile"
          searchColumnId="search"
          searchPlaceholder="Search scanned items..."
          emptyMessage="Scan a manifest QR to populate the inventory table."
          initialSorting={[{ id: "name", desc: false }]}
          initialColumnVisibility={{ search: false, added: false }}
          initialColumnOrder={[
            "status",
            "added",
            "name",
            "description",
            "manufacturer",
            "location",
            "type",
            "group",
            "price",
            "quantity",
            "search",
          ]}
          invisibleColumns={["search", "added"]}
          columnLabels={{
            name: "name",
            description: "description",
            manufacturer: "manufacturer",
            location: "location",
            type: "type",
            group: "group",
            price: "price",
            quantity: "quantity",
          }}
          filterTabs={filterTabs}
        />
      </div>
    </SectionAccordionCard>
  );
}
