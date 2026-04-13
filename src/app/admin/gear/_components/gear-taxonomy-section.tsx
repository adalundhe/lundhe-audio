"use client";

import * as React from "react";

import { Accordion } from "~/components/ui/accordion";
import { GroupedValueAccordionSelect } from "./grouped-value-accordion-select";
import { GearTaxonomyFacetAccordionItem } from "./gear-taxonomy-facet-accordion-item";
import { SectionAccordionCard } from "./section-accordion-card";
import { ValueAccordionSelect } from "./value-accordion-select";

export const GearTaxonomySection = React.memo(function GearTaxonomySection({
  state,
}: {
  state: any;
}) {
  return (
    <SectionAccordionCard
      value="taxonomy"
      title="Manage Types, Groups, Manufacturers & Locations"
      description="Add new values, rename existing ones across the current gear inventory, or delete unused custom values."
      contentClassName="min-w-0 px-0"
    >
      <Accordion
        type="multiple"
        className="flex min-w-0 flex-col gap-4"
        defaultValue={["types"]}
      >
        <GearTaxonomyFacetAccordionItem
          value="types"
          title="Types"
          description="Add a new type, rename an existing one everywhere it is used, or delete an unused custom type."
          selector={
            <ValueAccordionSelect
              id="rename-gear-type"
              label="Current Type"
              value={state.typeRenameTarget}
              options={state.availableGearTypes}
              placeholder="Choose a type to rename"
              onChange={(nextValue) => {
                state.setTypeRenameTarget(nextValue);
                state.setTypeRenameValue(nextValue);
              }}
            />
          }
          renameInputId="rename-gear-type-value"
          renameLabel="New Type Name"
          renameValue={state.typeRenameValue}
          renamePlaceholder="Enter the renamed type"
          onRenameValueChange={state.setTypeRenameValue}
          onRename={() => void state.handleRenameFacet("type")}
          renameDisabled={
            !state.isTypeRenameValid ||
            (state.renameFacetMutation.isPending &&
              state.renameFacetMutation.variables?.field === "type")
          }
          renamePending={
            state.renameFacetMutation.isPending &&
            state.renameFacetMutation.variables?.field === "type"
          }
          renameButtonLabel="Rename Type"
          onDelete={() => state.handleDeleteFacet("type")}
          deleteDisabled={
            state.typeRenameTarget.trim() === "" || state.selectedTypeUsageCount > 0
          }
          deleteButtonLabel="Delete Type"
          helperText={
            state.selectedTypeUsageCount > 0
              ? "This type is currently used by gear items, so rename it instead of deleting it."
              : "Unused custom types can be deleted here."
          }
          newInputId="new-gear-type-value"
          newLabel="Add New Type"
          newValue={state.newTypeValue}
          newPlaceholder="Enter a new type"
          onNewValueChange={state.setNewTypeValue}
          onAdd={() => state.handleAddFacet("type")}
          addDisabled={!state.newTypeValue.trim()}
          addButtonLabel="Add Type"
        />

        <GearTaxonomyFacetAccordionItem
          value="groups"
          title="Groups"
          description="Add a new group, rename an existing one everywhere it is used, or delete an unused custom group."
          selector={
            <ValueAccordionSelect
              id="rename-gear-group"
              label="Current Group"
              value={state.groupRenameTarget}
              options={state.availableGearGroups}
              placeholder="Choose a group to rename"
              onChange={(nextValue) => {
                state.setGroupRenameTarget(nextValue);
                state.setGroupRenameValue(nextValue);
              }}
            />
          }
          renameInputId="rename-gear-group-value"
          renameLabel="New Group Name"
          renameValue={state.groupRenameValue}
          renamePlaceholder="Enter the renamed group"
          onRenameValueChange={state.setGroupRenameValue}
          onRename={() => void state.handleRenameFacet("group")}
          renameDisabled={
            !state.isGroupRenameValid ||
            (state.renameFacetMutation.isPending &&
              state.renameFacetMutation.variables?.field === "group")
          }
          renamePending={
            state.renameFacetMutation.isPending &&
            state.renameFacetMutation.variables?.field === "group"
          }
          renameButtonLabel="Rename Group"
          onDelete={() => state.handleDeleteFacet("group")}
          deleteDisabled={
            state.groupRenameTarget.trim() === "" || state.selectedGroupUsageCount > 0
          }
          deleteButtonLabel="Delete Group"
          helperText={
            state.selectedGroupUsageCount > 0
              ? "This group is currently used by gear items, so rename it instead of deleting it."
              : "Unused custom groups can be deleted here."
          }
          newInputId="new-gear-group-value"
          newLabel="Add New Group"
          newValue={state.newGroupValue}
          newPlaceholder="Enter a new group"
          onNewValueChange={state.setNewGroupValue}
          onAdd={() => state.handleAddFacet("group")}
          addDisabled={!state.newGroupValue.trim()}
          addButtonLabel="Add Group"
        />

        <GearTaxonomyFacetAccordionItem
          value="manufacturers"
          title="Manufacturers"
          description="Add a new manufacturer, rename an existing one everywhere it is used, or delete an unused custom manufacturer."
          selector={
            <GroupedValueAccordionSelect
              id="rename-gear-manufacturer"
              label="Current Manufacturer"
              value={state.manufacturerRenameTarget}
              groupedOptions={state.availableManufacturerGroups}
              placeholder="Choose a manufacturer to rename"
              onChange={(nextValue) => {
                state.setManufacturerRenameTarget(nextValue);
                state.setManufacturerRenameValue(nextValue);
              }}
            />
          }
          renameInputId="rename-gear-manufacturer-value"
          renameLabel="New Manufacturer Name"
          renameValue={state.manufacturerRenameValue}
          renamePlaceholder="Enter the renamed manufacturer"
          onRenameValueChange={state.setManufacturerRenameValue}
          onRename={() => void state.handleRenameFacet("manufacturer")}
          renameDisabled={
            !state.isManufacturerRenameValid ||
            (state.renameFacetMutation.isPending &&
              state.renameFacetMutation.variables?.field === "manufacturer")
          }
          renamePending={
            state.renameFacetMutation.isPending &&
            state.renameFacetMutation.variables?.field === "manufacturer"
          }
          renameButtonLabel="Rename Manufacturer"
          onDelete={() => state.handleDeleteFacet("manufacturer")}
          deleteDisabled={
            state.manufacturerRenameTarget.trim() === "" ||
            state.selectedManufacturerUsageCount > 0
          }
          deleteButtonLabel="Delete Manufacturer"
          helperText={
            state.selectedManufacturerUsageCount > 0
              ? "This manufacturer is currently used by gear items, so rename it instead of deleting it."
              : "Unused custom manufacturers can be deleted here."
          }
          newInputId="new-gear-manufacturer-value"
          newLabel="Add New Manufacturer"
          newValue={state.newManufacturerValue}
          newPlaceholder="Enter a new manufacturer"
          onNewValueChange={state.setNewManufacturerValue}
          onAdd={() => state.handleAddFacet("manufacturer")}
          addDisabled={!state.newManufacturerValue.trim()}
          addButtonLabel="Add Manufacturer"
        />

        <GearTaxonomyFacetAccordionItem
          value="locations"
          title="Locations"
          description="Add a new location, rename an existing one everywhere it is used, or delete an unused custom location."
          selector={
            <ValueAccordionSelect
              id="rename-gear-location"
              label="Current Location"
              value={state.locationRenameTarget}
              options={state.availableLocations}
              placeholder="Choose a location to rename"
              onChange={(nextValue) => {
                state.setLocationRenameTarget(nextValue);
                state.setLocationRenameValue(nextValue);
              }}
            />
          }
          renameInputId="rename-gear-location-value"
          renameLabel="New Location Name"
          renameValue={state.locationRenameValue}
          renamePlaceholder="Enter the renamed location"
          onRenameValueChange={state.setLocationRenameValue}
          onRename={() => void state.handleRenameFacet("location")}
          renameDisabled={
            !state.isLocationRenameValid ||
            (state.renameFacetMutation.isPending &&
              state.renameFacetMutation.variables?.field === "location")
          }
          renamePending={
            state.renameFacetMutation.isPending &&
            state.renameFacetMutation.variables?.field === "location"
          }
          renameButtonLabel="Rename Location"
          onDelete={() => state.handleDeleteFacet("location")}
          deleteDisabled={
            state.locationRenameTarget.trim() === "" ||
            state.selectedLocationUsageCount > 0
          }
          deleteButtonLabel="Delete Location"
          helperText={
            state.selectedLocationUsageCount > 0
              ? "This location is currently used by gear items, so rename it instead of deleting it."
              : "Unused custom locations can be deleted here."
          }
          newInputId="new-gear-location-value"
          newLabel="Add New Location"
          newValue={state.newLocationValue}
          newPlaceholder="Enter a new location"
          onNewValueChange={state.setNewLocationValue}
          onAdd={() => state.handleAddFacet("location")}
          addDisabled={!state.newLocationValue.trim()}
          addButtonLabel="Add Location"
        />
      </Accordion>
    </SectionAccordionCard>
  );
});
