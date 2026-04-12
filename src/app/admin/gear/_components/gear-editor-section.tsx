"use client";

import * as React from "react";
import type { GearFormState } from "./gear-manager-types";
import { GearEditorForm } from "./gear-editor-form";
import { SectionAccordionCard } from "./section-accordion-card";

interface GearEditorSectionProps {
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
}

export const GearEditorSection = React.memo(function GearEditorSection({
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
}: GearEditorSectionProps) {
  return (
    <SectionAccordionCard
      value="editor"
      title={isEditing ? "Edit Gear Item" : "Add Gear Item"}
      description={
        isEditing
          ? `Editing "${form.name || "(unnamed)"}". Save to update or clear to start over.`
          : "Fill in the form to add a new piece of gear."
      }
      contentClassName="min-w-0"
    >
      <GearEditorForm
        isEditing={isEditing}
        form={form}
        setForm={setForm}
        error={error}
        handleSubmit={handleSubmit}
        handleClearForm={handleClearForm}
        isFormComplete={isFormComplete}
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
      />
    </SectionAccordionCard>
  );
});
