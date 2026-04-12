"use client";

import * as React from "react";
import { Loader2, Plus, Save, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import type { GearFormState } from "./gear-manager-types";
import { GroupedValueAccordionSelect } from "./grouped-value-accordion-select";
import { ValueAccordionSelect } from "./value-accordion-select";

interface GearEditorFormProps {
  idPrefix?: string;
  isEditing: boolean;
  form: GearFormState;
  setForm: React.Dispatch<React.SetStateAction<GearFormState>>;
  error: string | null;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  handleClearForm: () => void;
  isFormComplete: boolean;
  upsertMutation: {
    isPending: boolean;
  };
  availableManufacturerGroups: Record<string, string[]>;
  availableGearTypes: string[];
  availableGearGroups: string[];
  setCustomManufacturers: React.Dispatch<React.SetStateAction<string[]>>;
  setCustomGearTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setCustomGearGroups: React.Dispatch<React.SetStateAction<string[]>>;
  mergeUniqueOptions: (...collections: string[][]) => string[];
  handleNumberInputWheel: (event: React.WheelEvent<HTMLInputElement>) => void;
  pricingSection: React.ReactNode;
  showActions?: boolean;
  priceLabel?: string;
  quantityLabel?: string;
  addButtonLabel?: string;
  saveButtonLabel?: string;
  clearButtonLabel?: string;
  cancelButtonLabel?: string;
}

export const GearEditorForm = React.memo(function GearEditorForm({
  idPrefix = "gear",
  isEditing,
  form,
  setForm,
  error,
  handleSubmit,
  handleClearForm,
  isFormComplete,
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
  showActions = true,
  priceLabel = "Price (USD)",
  quantityLabel = "Quantity",
  addButtonLabel = "Add Item",
  saveButtonLabel = "Save Changes",
  clearButtonLabel = "Clear",
  cancelButtonLabel = "Cancel",
}: GearEditorFormProps) {
  return (
    <>
      {error ? (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      <form className="grid min-w-0 gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </div>
        <GroupedValueAccordionSelect
          id={`${idPrefix}-manufacturer`}
          label="Manufacturer"
          value={form.manufacturer}
          groupedOptions={availableManufacturerGroups}
          placeholder="e.g. API, Neve, Universal Audio"
          addLabel="Add Manufacturer"
          onChange={(nextValue) => setForm({ ...form, manufacturer: nextValue })}
          onAdd={(nextValue) =>
            setCustomManufacturers((current) => mergeUniqueOptions(current, [nextValue]))
          }
        />
        <ValueAccordionSelect
          id={`${idPrefix}-type`}
          label="Type"
          value={form.type}
          options={availableGearTypes}
          placeholder="e.g. preamp, mic, monitor"
          addLabel="Add Type"
          onChange={(nextValue) => setForm({ ...form, type: nextValue })}
          onAdd={(nextValue) =>
            setCustomGearTypes((current) => mergeUniqueOptions(current, [nextValue]))
          }
        />
        <ValueAccordionSelect
          id={`${idPrefix}-group`}
          label="Group"
          value={form.group}
          options={availableGearGroups}
          placeholder="e.g. outboard, monitoring"
          addLabel="Add Group"
          onChange={(nextValue) => setForm({ ...form, group: nextValue })}
          onAdd={(nextValue) =>
            setCustomGearGroups((current) => mergeUniqueOptions(current, [nextValue]))
          }
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-price`}>{priceLabel}</Label>
          <Input
            id={`${idPrefix}-price`}
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={form.price}
            onWheel={handleNumberInputWheel}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-quantity`}>{quantityLabel}</Label>
          <Input
            id={`${idPrefix}-quantity`}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={form.quantity}
            onWheel={handleNumberInputWheel}
            onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-description`}>Description</Label>
          <Textarea
            id={`${idPrefix}-description`}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            rows={3}
            required
          />
        </div>

        {pricingSection}

        {showActions ? (
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              type="submit"
              size="sm"
              disabled={upsertMutation.isPending || !isFormComplete}
              className="flex w-full gap-1 border border-black align-middle hover:border-green-500 hover:bg-green-50 hover:text-green-500 dark:border-white dark:hover:bg-green-950/30 sm:w-auto"
            >
              {upsertMutation.isPending ? (
                <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
              ) : isEditing ? (
                <Save className="mr-2 !h-[16px] !w-[16px]" />
              ) : (
                <Plus className="mr-2 !h-[16px] !w-[16px]" />
              )}
              {isEditing ? saveButtonLabel : addButtonLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleClearForm}
              disabled={upsertMutation.isPending}
              className="flex w-full gap-1 border border-red-600 align-middle text-red-600 hover:bg-red-600/30 sm:w-auto"
            >
              <X className="mr-2 !h-[16px] !w-[16px]" />
              {isEditing ? cancelButtonLabel : clearButtonLabel}
            </Button>
          </div>
        ) : null}
      </form>
    </>
  );
});
