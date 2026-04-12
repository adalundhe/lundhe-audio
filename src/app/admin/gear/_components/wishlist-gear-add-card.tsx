"use client";

import * as React from "react";

import { GearEditorForm } from "./gear-editor-form";
import { emptyWishlistForm } from "./wishlist-gear-helpers";
import type { WishlistGearFormState } from "./wishlist-gear-manager-types";

interface WishlistGearAddCardProps {
  form: WishlistGearFormState;
  formExternalVersion: number;
  publishForm: (form: WishlistGearFormState) => void;
  submitForm: (form: WishlistGearFormState) => Promise<unknown>;
  clearForm: () => void;
  error: string | null;
  upsertMutation: { isPending: boolean };
  availableManufacturerGroups: Record<string, string[]>;
  availableGearTypes: string[];
  availableGearGroups: string[];
  setCustomManufacturers: React.Dispatch<React.SetStateAction<string[]>>;
  setCustomGearTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setCustomGearGroups: React.Dispatch<React.SetStateAction<string[]>>;
  mergeUniqueOptions: (...collections: string[][]) => string[];
  handleNumberInputWheel: (event: React.WheelEvent<HTMLInputElement>) => void;
  pricingSection: React.ReactNode;
}

export const WishlistGearAddCard = React.memo(function WishlistGearAddCard({
  form,
  formExternalVersion,
  publishForm,
  submitForm,
  clearForm,
  error,
  upsertMutation,
  availableManufacturerGroups,
  availableGearTypes,
  availableGearGroups,
  setCustomManufacturers,
  setCustomGearTypes,
  setCustomGearGroups,
  mergeUniqueOptions,
  handleNumberInputWheel,
  pricingSection,
}: WishlistGearAddCardProps) {
  const [draftForm, setDraftForm] = React.useState(form);
  const deferredDraftForm = React.useDeferredValue(draftForm);

  const formsEqual = React.useCallback(
    (left: WishlistGearFormState, right: WishlistGearFormState) =>
      left.id === right.id &&
      left.name === right.name &&
      left.description === right.description &&
      left.type === right.type &&
      left.group === right.group &&
      left.price === right.price &&
      left.quantity === right.quantity &&
      left.manufacturer === right.manufacturer,
    [],
  );

  React.useEffect(() => {
    setDraftForm(form);
  }, [formExternalVersion]);

  React.useEffect(() => {
    if (form.id !== null || formsEqual(form, deferredDraftForm)) {
      return;
    }

    React.startTransition(() => {
      publishForm(deferredDraftForm);
    });
  }, [deferredDraftForm, form, formsEqual, publishForm]);

  const parsedPrice = React.useMemo(() => Number(draftForm.price), [draftForm.price]);
  const parsedQuantity = React.useMemo(
    () => Number(draftForm.quantity),
    [draftForm.quantity],
  );
  const isPriceValid =
    draftForm.price.trim() !== "" &&
    Number.isFinite(parsedPrice) &&
    parsedPrice >= 0;
  const isQuantityValid =
    draftForm.quantity.trim() !== "" &&
    Number.isFinite(parsedQuantity) &&
    parsedQuantity >= 0 &&
    Number.isInteger(parsedQuantity);
  const isDraftFormComplete =
    draftForm.name.trim() !== "" &&
    draftForm.manufacturer.trim() !== "" &&
    draftForm.type.trim() !== "" &&
    draftForm.group.trim() !== "" &&
    draftForm.description.trim() !== "" &&
    isPriceValid &&
    isQuantityValid;

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submitForm(draftForm);
    },
    [draftForm, submitForm],
  );

  const handleClear = React.useCallback(() => {
    setDraftForm(emptyWishlistForm);
    clearForm();
  }, [clearForm]);

  return (
    <div className="rounded-md border px-4 py-4">
      <div className="mb-4 flex flex-col gap-1">
        <div className="text-sm font-medium">Add Wishlist Item</div>
        <div className="text-xs text-muted-foreground">
          Capture a target purchase with pricing comps before it becomes an owned
          studio asset.
        </div>
      </div>
      <GearEditorForm
        idPrefix="wishlist"
        isEditing={false}
        form={draftForm}
        setForm={setDraftForm}
        error={error}
        handleSubmit={handleSubmit}
        handleClearForm={handleClear}
        isFormComplete={isDraftFormComplete}
        upsertMutation={upsertMutation}
        availableManufacturerGroups={availableManufacturerGroups}
        availableGearTypes={availableGearTypes}
        availableGearGroups={availableGearGroups}
        setCustomManufacturers={setCustomManufacturers}
        setCustomGearTypes={setCustomGearTypes}
        setCustomGearGroups={setCustomGearGroups}
        mergeUniqueOptions={mergeUniqueOptions}
        handleNumberInputWheel={handleNumberInputWheel}
        pricingSection={pricingSection}
        priceLabel="Target Price (USD)"
        quantityLabel="Desired Quantity"
        addButtonLabel="Add to Wishlist"
        clearButtonLabel="Clear"
      />
    </div>
  );
});
