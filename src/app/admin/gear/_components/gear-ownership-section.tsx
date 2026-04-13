"use client";

import * as React from "react";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { GearDetailsFormState } from "./gear-manager-types";

interface GearOwnershipSectionProps {
  itemId: string;
  detailsForm: GearDetailsFormState;
  setDetailsForm: React.Dispatch<React.SetStateAction<GearDetailsFormState>>;
}

export const GearOwnershipSection = React.memo(function GearOwnershipSection({
  itemId,
  detailsForm,
  setDetailsForm,
}: GearOwnershipSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">Serial / Ownership Data</div>
        <div className="text-xs text-muted-foreground">
          Track serial number, acquisition details, and any order/reference data
          tied to this piece of gear.
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`inventory-serial-number-${itemId}`}>Serial Number</Label>
          <Input
            id={`inventory-serial-number-${itemId}`}
            value={detailsForm.serialNumber}
            onChange={(event) =>
              setDetailsForm((current) => ({
                ...current,
                serialNumber: event.target.value,
              }))
            }
            placeholder="e.g. SN1234567"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`inventory-acquired-from-${itemId}`}>Acquired From</Label>
          <Input
            id={`inventory-acquired-from-${itemId}`}
            value={detailsForm.acquiredFrom}
            onChange={(event) =>
              setDetailsForm((current) => ({
                ...current,
                acquiredFrom: event.target.value,
              }))
            }
            placeholder="e.g. Reverb seller, local studio, dealer"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`inventory-purchase-date-${itemId}`}>Purchase Date</Label>
          <Input
            id={`inventory-purchase-date-${itemId}`}
            type="date"
            value={detailsForm.purchaseDate}
            onChange={(event) =>
              setDetailsForm((current) => ({
                ...current,
                purchaseDate: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`inventory-purchase-source-${itemId}`}>Purchase Source</Label>
          <Input
            id={`inventory-purchase-source-${itemId}`}
            value={detailsForm.purchaseSource}
            onChange={(event) =>
              setDetailsForm((current) => ({
                ...current,
                purchaseSource: event.target.value,
              }))
            }
            placeholder="e.g. Reverb, dealer, direct"
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`inventory-reference-number-${itemId}`}>
            Order / Reference Number
          </Label>
          <Input
            id={`inventory-reference-number-${itemId}`}
            value={detailsForm.referenceNumber}
            onChange={(event) =>
              setDetailsForm((current) => ({
                ...current,
                referenceNumber: event.target.value,
              }))
            }
            placeholder="e.g. invoice, order, or internal reference"
          />
        </div>
      </div>
    </div>
  );
});
