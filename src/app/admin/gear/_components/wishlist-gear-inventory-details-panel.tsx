"use client";

import * as React from "react";
import { ArrowRightLeft, Loader2, Save, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import {
  type WishlistGearDetailsFormState,
  type WishlistGearItem,
  type WishlistStatus,
  wishlistStatusMetadata,
  wishlistStatusOrder,
} from "./wishlist-gear-manager-types";

interface WishlistGearInventoryDetailsPanelProps {
  item: WishlistGearItem;
  editorSection: React.ReactNode;
  detailsForm: WishlistGearDetailsFormState;
  setDetailsForm: React.Dispatch<
    React.SetStateAction<WishlistGearDetailsFormState>
  >;
  detailsError: string | null;
  isDetailsDirty: boolean;
  isEditorDirty: boolean;
  isFormComplete: boolean;
  isSavingDetails: boolean;
  isPromoting: boolean;
  updateStatusMutation: {
    isPending: boolean;
  };
  handleStatusChange: (status: WishlistStatus) => void;
  handleSaveDetails: () => Promise<void>;
  handlePromote: () => Promise<void>;
  resetDetails: () => void;
}

export const WishlistGearInventoryDetailsPanel = React.memo(
  function WishlistGearInventoryDetailsPanel({
    item,
    editorSection,
    detailsForm,
    setDetailsForm,
    detailsError,
    isDetailsDirty,
    isEditorDirty,
    isFormComplete,
    isSavingDetails,
    isPromoting,
    updateStatusMutation,
    handleStatusChange,
    handleSaveDetails,
    handlePromote,
    resetDetails,
  }: WishlistGearInventoryDetailsPanelProps) {
    return (
      <div className="flex min-w-0 flex-col gap-6">
        {detailsError ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {detailsError}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
              <div
                className={cn(
                  "flex min-h-6 flex-col items-center gap-3 rounded-sm px-2 py-2 transition-colors duration-200 ease-out",
                  wishlistStatusMetadata[detailsForm.status].containerClassName,
                )}
              >
                <div className="w-full text-center">
                  <span
                    className={cn(
                      "transition-colors duration-200 ease-out",
                      wishlistStatusMetadata[detailsForm.status].labelClassName,
                    )}
                  >
                    Set the wishlist status for this item.
                  </span>
                </div>
                <div className="flex w-full flex-row justify-center gap-3">
                  <div
                    role="radiogroup"
                    aria-label="Wishlist status"
                    className={cn(
                      "relative flex h-4 w-11 items-center rounded-full bg-input/60 p-0.5 transition-colors duration-200 ease-out",
                      wishlistStatusMetadata[detailsForm.status].switchClassName,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute left-0.5 top-1/2 z-20 h-3 w-3 -translate-y-1/2 rounded-full shadow-lg transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out",
                        wishlistStatusMetadata[detailsForm.status].dotClassName,
                        detailsForm.status === "researching" && "translate-x-0",
                        detailsForm.status === "watching" && "translate-x-[14px]",
                        detailsForm.status === "ready-to-buy" &&
                          "translate-x-[28px]",
                      )}
                    />
                    {wishlistStatusOrder.map((status) => (
                      <button
                        key={status}
                        type="button"
                        role="radio"
                        aria-checked={detailsForm.status === status}
                        aria-label={wishlistStatusMetadata[status].label}
                        title={wishlistStatusMetadata[status].label}
                        disabled={updateStatusMutation.isPending}
                        className="relative z-10 h-full flex-1 rounded-full focus-visible:outline-none"
                        onClick={() => handleStatusChange(status)}
                      >
                        <span className="sr-only">
                          {wishlistStatusMetadata[status].label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium leading-none transition-colors duration-200 ease-out",
                      wishlistStatusMetadata[detailsForm.status].labelClassName,
                    )}
                  >
                    {wishlistStatusMetadata[detailsForm.status].label}
                  </span>
                </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">Details</div>
              <div className="text-xs text-muted-foreground">
                Update the wishlist entry, review Reverb pricing, and compare
                price history before promoting it into the studio inventory.
              </div>
            </div>
            {editorSection}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">Notes</div>
              <div className="text-xs text-muted-foreground">
                Track seller notes, deal context, missing parts, or acquisition
                rationale for {item.name}.
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`wishlist-notes-${item.id}`}>Notes</Label>
              <Textarea
                id={`wishlist-notes-${item.id}`}
                rows={5}
                value={detailsForm.notes}
                onChange={(event) =>
                  setDetailsForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Add acquisition notes..."
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                type="button"
                size="sm"
                disabled={
                  (!isDetailsDirty && !isEditorDirty) ||
                  isSavingDetails ||
                  isPromoting ||
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
                disabled={isSavingDetails || isPromoting}
                onClick={resetDetails}
                className="w-full border border-red-600 text-red-600 hover:bg-red-600/30 sm:w-auto"
              >
                <X className="mr-2 !h-[16px] !w-[16px]" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSavingDetails || isPromoting || !isFormComplete}
                onClick={() => void handlePromote()}
                className="w-full border border-black hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600 dark:border-white dark:hover:bg-cyan-950/30 sm:ml-auto sm:w-auto"
              >
                {isPromoting ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : (
                  <ArrowRightLeft className="mr-2 !h-[16px] !w-[16px]" />
                )}
                Promote to Inventory
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
