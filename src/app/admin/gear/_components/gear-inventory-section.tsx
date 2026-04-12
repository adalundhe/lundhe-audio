"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import {
  AdminDataTable,
  type AdminDataTableColumnDef,
} from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import { SectionAccordionCard } from "./section-accordion-card";
import type { GearItem } from "./gear-manager-types";

interface GearInventorySectionProps {
  gear: GearItem[];
  inventoryTableData: GearItem[];
  isCreatingInline: boolean;
  openNewRow: () => void;
  inventoryColumns: AdminDataTableColumnDef<GearItem>[];
  selectedInventoryItemId: string | null;
  handleSelectRow: (item: GearItem) => void;
  inventoryFilterTabs: Array<{
    value: string;
    label: string;
    render: (table: import("@tanstack/react-table").Table<GearItem>) => React.ReactNode;
  }>;
  renderExpandedInventoryRow: (item: GearItem) => React.ReactNode;
}

interface GearInventoryTableProps
  extends Omit<GearInventorySectionProps, "gear"> {}

export const GearInventoryTable = React.memo(function GearInventoryTable({
  inventoryTableData,
  isCreatingInline,
  openNewRow,
  inventoryColumns,
  selectedInventoryItemId,
  handleSelectRow,
  inventoryFilterTabs,
  renderExpandedInventoryRow,
}: GearInventoryTableProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <AdminDataTable
        data={inventoryTableData}
        columns={inventoryColumns}
        footerControlsLayout="stacked-mobile"
        footerLeftContent={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openNewRow}
            disabled={isCreatingInline}
            className="border border-black dark:border-white"
          >
            <Plus className="mr-2 !h-[16px] !w-[16px]" />
            Add Row
          </Button>
        }
        searchColumnId="search"
        searchPlaceholder="Search gear..."
        emptyMessage="No results."
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
          "actions",
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
        paginationStorageKey="admin-gear-inventory-pagination"
        getRowClassName={(row) =>
          selectedInventoryItemId === row.original.id ? "bg-muted" : undefined
        }
        onRowClick={handleSelectRow}
        filterTabs={inventoryFilterTabs}
        isRowExpanded={(row) => selectedInventoryItemId === row.original.id}
        renderExpandedRow={(row) => renderExpandedInventoryRow(row.original)}
      />
    </div>
  );
});

export const GearInventorySection = React.memo(function GearInventorySection({
  gear,
  inventoryTableData,
  isCreatingInline,
  openNewRow,
  inventoryColumns,
  selectedInventoryItemId,
  handleSelectRow,
  inventoryFilterTabs,
  renderExpandedInventoryRow,
}: GearInventorySectionProps) {
  return (
    <SectionAccordionCard
      value="inventory"
      title="Inventory"
      description={`${gear.length} item${gear.length === 1 ? "" : "s"}. Click a row to edit, set status, and manage item details.`}
      contentClassName="min-w-0"
    >
      <GearInventoryTable
        inventoryTableData={inventoryTableData}
        isCreatingInline={isCreatingInline}
        openNewRow={openNewRow}
        inventoryColumns={inventoryColumns}
        selectedInventoryItemId={selectedInventoryItemId}
        handleSelectRow={handleSelectRow}
        inventoryFilterTabs={inventoryFilterTabs}
        renderExpandedInventoryRow={renderExpandedInventoryRow}
      />
    </SectionAccordionCard>
  );
});
