"use client";

import * as React from "react";
import { Loader2, Plus, RotateCcw } from "lucide-react";

import { AdminDataTable } from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { SectionAccordionCard } from "~/app/admin/gear/_components/section-accordion-card";
import { type ManifestGearItem } from "./manifest-manager-types";
import { useManifestGearTableConfig } from "./manifest-gear-table-config";

export function ManifestBuilderSection({
  gear,
  manifestName,
  manifestNotes,
  setManifestName,
  setManifestNotes,
  selectedIds,
  toggleSelected,
  clearSelected,
  builderError,
  isSaving,
  onCreate,
}: {
  gear: ManifestGearItem[];
  manifestName: string;
  manifestNotes: string;
  setManifestName: (value: string) => void;
  setManifestNotes: (value: string) => void;
  selectedIds: string[];
  toggleSelected: (id: string, next: boolean) => void;
  clearSelected: () => void;
  builderError: string | null;
  isSaving: boolean;
  onCreate: () => void;
}) {
  const { columns, filterTabs } = useManifestGearTableConfig({
    gear,
    selectable: true,
    selectedIds,
    onToggleSelected: toggleSelected,
  });
  const selectedIdSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  return (
    <SectionAccordionCard
      value="builder"
      title="Create Manifest"
      description="Select one or more inventory rows, persist the manifest, then print one or more QR parts."
      contentClassName="min-w-0 px-0"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <label className="text-sm font-medium">Manifest Name</label>
              <Input
                value={manifestName}
                onChange={(event) => setManifestName(event.target.value)}
                placeholder="Studio move - outboard rack"
              />
            </div>
          </div>

          <div className="mt-4 flex min-w-0 flex-col gap-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={manifestNotes}
              onChange={(event) => setManifestNotes(event.target.value)}
              placeholder="Optional packing, location, or move notes."
              className="min-h-24"
            />
          </div>

          {builderError ? (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {builderError}
            </div>
          ) : null}
        </div>

        <AdminDataTable
          data={gear}
          columns={columns}
          footerControlsLayout="stacked-mobile"
          searchColumnId="search"
          searchPlaceholder="Search gear..."
          emptyMessage="No inventory rows available."
          initialSorting={[{ id: "name", desc: false }]}
          initialColumnVisibility={{ search: false, added: false }}
          initialColumnOrder={[
            "selected",
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
            "selected-state",
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
          getRowClassName={(row) =>
            selectedIdSet.has(row.original.id) ? "bg-muted" : undefined
          }
          onRowClick={(row) => toggleSelected(row.id, !selectedIdSet.has(row.id))}
        />

        <div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedIds.length} item{selectedIds.length === 1 ? "" : "s"} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelected}
                disabled={selectedIds.length === 0}
              >
                <RotateCcw className="mr-2 !h-[16px] !w-[16px]" />
                Clear Selection
              </Button>
              <Button type="button" size="sm" onClick={onCreate} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : (
                  <Plus className="mr-2 !h-[16px] !w-[16px]" />
                )}
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SectionAccordionCard>
  );
}
