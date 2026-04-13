"use client";

import * as React from "react";
import { Loader2, Save, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import {
  gearStatusMetadata,
  gearStatusOrder,
  type GearDetailsFormState,
  type GearItem,
  type GearStatus,
} from "./gear-manager-types";
import { GearOwnershipSection } from "./gear-ownership-section";
import { GearServiceLogSection } from "./gear-service-log-section";
import { ValueAccordionSelect } from "./value-accordion-select";

interface GearInventoryDetailsPanelProps {
  item: GearItem;
  editorSection?: React.ReactNode;
  detailsError: string | null;
  detailsForm: GearDetailsFormState;
  setDetailsForm: React.Dispatch<React.SetStateAction<GearDetailsFormState>>;
  availableLocations: string[];
  setCustomLocations: React.Dispatch<React.SetStateAction<string[]>>;
  mergeUniqueOptions: (...collections: string[][]) => string[];
  updateStatusMutation: {
    isPending: boolean;
  };
  handleStatusChange: (status: GearStatus) => void;
  mediaSection?: React.ReactNode;
  serviceLogSection: React.ReactNode;
  isDetailsDirty: boolean;
  isEditorDirty: boolean;
  isFormComplete: boolean;
  isSavingDetails: boolean;
  handleSaveDetails: () => Promise<void>;
  resetDetails: () => void;
}

export const GearInventoryDetailsPanel = React.memo(
  function GearInventoryDetailsPanel({
    item,
    editorSection,
    detailsError,
    detailsForm,
    setDetailsForm,
    availableLocations,
    setCustomLocations,
    mergeUniqueOptions,
    updateStatusMutation,
    handleStatusChange,
    mediaSection,
    serviceLogSection,
    isDetailsDirty,
    isEditorDirty,
    isFormComplete,
    isSavingDetails,
    handleSaveDetails,
    resetDetails,
  }: GearInventoryDetailsPanelProps) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {detailsError ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {detailsError}
          </div>
        ) : null}

        <div className="min-w-0 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <div
                  className={cn(
                    "flex min-h-6 flex-col items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-200 ease-out",
                    gearStatusMetadata[detailsForm.status].containerClassName,
                  )}
                >
                  <div className="w-full text-center">
                    <span
                      className={cn(
                        "transition-colors duration-200 ease-out",
                        gearStatusMetadata[detailsForm.status].labelClassName,
                      )}
                    >
                      Set the status for this item.
                    </span>
                  </div>
                  <div className="flex w-full flex-row justify-center gap-3">
                    <div
                      role="radiogroup"
                      aria-label="Gear status"
                      className={cn(
                        "relative flex h-4 w-11 items-center rounded-full bg-input/60 p-0.5 transition-colors duration-200 ease-out",
                        gearStatusMetadata[detailsForm.status].switchClassName,
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute left-0.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full shadow-lg transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out",
                          gearStatusMetadata[detailsForm.status].dotClassName,
                          detailsForm.status === "active" && "translate-x-0",
                          detailsForm.status === "inactive" && "translate-x-[14px]",
                          detailsForm.status === "out-of-order" &&
                            "translate-x-[28px]",
                        )}
                      />
                      {gearStatusOrder.map((status) => (
                        <button
                          key={status}
                          type="button"
                          role="radio"
                          aria-checked={detailsForm.status === status}
                          aria-label={gearStatusMetadata[status].label}
                          title={gearStatusMetadata[status].label}
                          disabled={updateStatusMutation.isPending}
                          className="relative z-10 h-full flex-1 rounded-full focus-visible:outline-none"
                          onClick={() => handleStatusChange(status)}
                        >
                          <span className="sr-only">
                            {gearStatusMetadata[status].label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-medium leading-none transition-colors duration-200 ease-out",
                        gearStatusMetadata[detailsForm.status].labelClassName,
                      )}
                    >
                      {gearStatusMetadata[detailsForm.status].label}
                    </span>
                  </div>
                </div>
              </div>
              <ValueAccordionSelect
                id={`inventory-location-${item.id}`}
                label="Location"
                value={detailsForm.location}
                options={availableLocations}
                placeholder="Choose or add a location"
                addLabel="Add Location"
                onChange={(nextValue) =>
                  setDetailsForm((current) => ({
                    ...current,
                    location: nextValue,
                  }))
                }
                onAdd={(nextValue) =>
                  setCustomLocations((current) =>
                    mergeUniqueOptions(current, [nextValue]),
                  )
                }
              />
            </div>
          </div>

          {editorSection ? (
            <>
              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium">Details</div>
                  <div className="text-xs text-muted-foreground">
                    Update the core inventory fields, Reverb pricing matches, and
                    price history for this item here in the row.
                  </div>
                </div>
                {editorSection}
              </div>
            </>
          ) : null}

          <Separator />

          {serviceLogSection}

          {mediaSection ? (
            <>
              <Separator />
              {mediaSection}
            </>
          ) : null}

          <Separator />

          <GearOwnershipSection
            itemId={item.id}
            detailsForm={detailsForm}
            setDetailsForm={setDetailsForm}
          />

          <Separator />

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">Notes</div>
              <div className="text-xs text-muted-foreground">
                Capture setup quirks, patching notes, or anything else worth
                keeping with the item.
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`inventory-notes-${item.id}`}>Notes</Label>
              <Textarea
                id={`inventory-notes-${item.id}`}
                rows={5}
                value={detailsForm.notes}
                onChange={(event) =>
                  setDetailsForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Add notes about this piece of gear..."
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                size="sm"
                disabled={
                  (!isDetailsDirty && !isEditorDirty) ||
                  isSavingDetails ||
                  (isEditorDirty && !isFormComplete)
                }
                onClick={() => void handleSaveDetails()}
                className="w-full border border-black hover:border-green-500 hover:bg-green-50 hover:text-green-500 dark:border-white dark:hover:bg-green-950/30 sm:w-auto"
              >
                {isSavingDetails ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : (
                  <Save className="mr-2 !h-[16px] !w-[16px]" />
                )}
                Save Details
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSavingDetails}
                onClick={resetDetails}
                className="w-full border border-red-600 text-red-600 hover:bg-red-600/30 sm:w-auto"
              >
                <X className="mr-2 !h-[16px] !w-[16px]" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
