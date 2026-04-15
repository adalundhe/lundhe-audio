"use client";

import * as React from "react";
import { AlertCircle, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import {
  type AdminDataTableColumnDef,
  AdminDataTable,
  FilterTabPanel,
  SimpleFilterOption,
  SortableHeader,
} from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import type { GearItem, GearServiceLog, ServiceLogFormState } from "./gear-manager-types";

interface GearServiceLogSectionProps {
  item: GearItem;
  serviceLogError: string | null;
  isServiceLogEditorOpen: boolean;
  serviceLogForm: ServiceLogFormState;
  setServiceLogForm: React.Dispatch<React.SetStateAction<ServiceLogFormState>>;
  canAddServiceLog: boolean;
  isEditingServiceLog: boolean;
  addServiceLogMutation: {
    isPending: boolean;
  };
  updateServiceLogMutation: {
    isPending: boolean;
  };
  deleteServiceLogMutation: {
    isPending: boolean;
    mutateAsync: (input: { id: string }) => Promise<unknown>;
  };
  handleSaveServiceLog: () => Promise<void>;
  resetServiceLogEditor: () => void;
  openNewServiceLogEditor: () => void;
  openEditServiceLogEditor: (serviceLog: GearServiceLog) => void;
}

export const GearServiceLogSection = React.memo(function GearServiceLogSection({
  item,
  serviceLogError,
  isServiceLogEditorOpen,
  serviceLogForm,
  setServiceLogForm,
  canAddServiceLog,
  isEditingServiceLog,
  addServiceLogMutation,
  updateServiceLogMutation,
  deleteServiceLogMutation,
  handleSaveServiceLog,
  resetServiceLogEditor,
  openNewServiceLogEditor,
  openEditServiceLogEditor,
}: GearServiceLogSectionProps) {
  const availableServiceTypes = React.useMemo(
    () =>
      [...new Map(
        item.serviceLogs
          .map((serviceLog) => serviceLog.serviceType.trim())
          .filter(Boolean)
          .map((value) => [value.toLocaleLowerCase(), value]),
      ).values()].sort((left, right) => left.localeCompare(right)),
    [item.serviceLogs],
  );

  const serviceLogColumns = React.useMemo<AdminDataTableColumnDef<GearServiceLog>[]>(
    () => [
      {
        accessorKey: "serviceType",
        filterFn: "equalsString",
        size: 220,
        minSize: 180,
        maxSize: 320,
        header: ({ column }) => (
          <SortableHeader column={column} label="Service Type" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm font-medium">
            {row.original.serviceType}
          </div>
        ),
      },
      {
        accessorKey: "serviceDate",
        size: 160,
        minSize: 130,
        maxSize: 220,
        header: ({ column }) => (
          <SortableHeader column={column} label="Service Date" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.serviceDate}</div>
        ),
      },
      {
        accessorKey: "warrantyUntil",
        id: "warrantyUntil",
        filterFn: (row, _, filterValue: "with" | "without" | "") => {
          const hasWarranty = row.original.warrantyUntil.trim() !== "";
          if (filterValue === "with") return hasWarranty;
          if (filterValue === "without") return !hasWarranty;
          return true;
        },
        size: 180,
        minSize: 150,
        maxSize: 240,
        header: ({ column }) => (
          <SortableHeader column={column} label="Warranty Until" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.warrantyUntil || "—"}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        size: 420,
        minSize: 260,
        maxSize: 640,
        enableSorting: false,
        header: () => (
          <div className="flex h-full w-full items-center justify-start gap-3 text-left text-muted-foreground">
            Notes
          </div>
        ),
        cell: ({ row }) => (
          <div className="max-w-[28rem] truncate text-sm text-muted-foreground" title={row.original.notes || "—"}>
            {row.original.notes || "—"}
          </div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [
            row.serviceType,
            row.serviceDate,
            row.warrantyUntil,
            row.notes,
          ].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        size: 70,
        minSize: 70,
        maxSize: 70,
        header: () => <div className="w-fit" />,
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none inline-flex items-center gap-1 rounded-md border bg-background/95 p-1 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={
                  deleteServiceLogMutation.isPending ||
                  addServiceLogMutation.isPending ||
                  updateServiceLogMutation.isPending
                }
                onClick={() => openEditServiceLogEditor(row.original)}
                className="h-7 px-2"
              >
                <Pencil className="mr-1 !h-[16px] !w-[16px]" />
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deleteServiceLogMutation.isPending}
                onClick={() =>
                  void deleteServiceLogMutation.mutateAsync({ id: row.original.id })
                }
                className="h-7 px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 !h-[16px] !w-[16px]" />
                Delete
              </Button>
            </div>
          </div>
        ),
      },
    ],
    [
      addServiceLogMutation.isPending,
      deleteServiceLogMutation,
      openEditServiceLogEditor,
      updateServiceLogMutation.isPending,
    ],
  );

  const serviceLogFilterTabs = React.useMemo(
    () => [
      {
        value: "serviceType",
        label: "Service Type",
        render: (table: import("@tanstack/react-table").Table<GearServiceLog>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("serviceType")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("serviceType")?.setFilterValue("")}
            />
            <Separator />
            {availableServiceTypes.map((serviceType) => (
              <SimpleFilterOption
                key={serviceType}
                active={
                  (table.getColumn("serviceType")?.getFilterValue() ?? "") ===
                  serviceType
                }
                label={serviceType}
                onToggle={() =>
                  table.getColumn("serviceType")?.setFilterValue(
                    (table.getColumn("serviceType")?.getFilterValue() ?? "") ===
                      serviceType
                      ? ""
                      : serviceType,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
      {
        value: "warranty",
        label: "Warranty",
        render: (table: import("@tanstack/react-table").Table<GearServiceLog>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("warrantyUntil")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("warrantyUntil")?.setFilterValue("")}
            />
            <Separator />
            <SimpleFilterOption
              active={(table.getColumn("warrantyUntil")?.getFilterValue() ?? "") === "with"}
              label="With Warranty"
              onToggle={() =>
                table.getColumn("warrantyUntil")?.setFilterValue(
                  (table.getColumn("warrantyUntil")?.getFilterValue() ?? "") ===
                    "with"
                    ? ""
                    : "with",
                )
              }
            />
            <SimpleFilterOption
              active={(table.getColumn("warrantyUntil")?.getFilterValue() ?? "") === "without"}
              label="Without Warranty"
              onToggle={() =>
                table.getColumn("warrantyUntil")?.setFilterValue(
                  (table.getColumn("warrantyUntil")?.getFilterValue() ?? "") ===
                    "without"
                    ? ""
                    : "without",
                )
              }
            />
          </FilterTabPanel>
        ),
      },
    ],
    [availableServiceTypes],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">Service / Maintenance Log</div>
        <div className="text-xs text-muted-foreground">
          Track repairs, tube swaps, recaps, calibration, warranty dates, and
          service notes for this item.
        </div>
      </div>

      {serviceLogError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serviceLogError}
        </div>
      ) : null}

      {isServiceLogEditorOpen ? (
        <div className="rounded-md border bg-muted/10 p-3">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.55fr)_minmax(10rem,0.55fr)]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`service-type-${item.id}`}>Service Type</Label>
              <Input
                id={`service-type-${item.id}`}
                value={serviceLogForm.serviceType}
                onChange={(event) =>
                  setServiceLogForm((current) => ({
                    ...current,
                    serviceType: event.target.value,
                  }))
                }
                placeholder="e.g. Tube swap"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`service-date-${item.id}`}>Service Date</Label>
              <Input
                id={`service-date-${item.id}`}
                type="date"
                value={serviceLogForm.serviceDate}
                onChange={(event) =>
                  setServiceLogForm((current) => ({
                    ...current,
                    serviceDate: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`warranty-until-${item.id}`}>Warranty Until</Label>
              <Input
                id={`warranty-until-${item.id}`}
                type="date"
                value={serviceLogForm.warrantyUntil}
                onChange={(event) =>
                  setServiceLogForm((current) => ({
                    ...current,
                    warrantyUntil: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1.5">
            <Label htmlFor={`service-notes-${item.id}`}>Notes</Label>
            <Textarea
              id={`service-notes-${item.id}`}
              rows={3}
              value={serviceLogForm.notes}
              onChange={(event) =>
                setServiceLogForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Describe the service, repair, calibration, or warranty note..."
            />
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="sm"
              disabled={
                !canAddServiceLog ||
                addServiceLogMutation.isPending ||
                updateServiceLogMutation.isPending
              }
              onClick={() => void handleSaveServiceLog()}
              className="w-full border border-black dark:border-white sm:w-auto"
            >
              {addServiceLogMutation.isPending || updateServiceLogMutation.isPending ? (
                <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
              ) : isEditingServiceLog ? (
                <Save className="mr-2 !h-[16px] !w-[16px]" />
              ) : (
                <Plus className="mr-2 !h-[16px] !w-[16px]" />
              )}
              {isEditingServiceLog ? "Save Changes" : "Add Row"}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={addServiceLogMutation.isPending || updateServiceLogMutation.isPending}
              onClick={resetServiceLogEditor}
              className="w-full border border-red-600 text-red-600 hover:bg-red-600/30 sm:w-auto"
            >
              <X className="mr-2 !h-[16px] !w-[16px]" />
              {isEditingServiceLog ? "Cancel" : "Clear"}
            </Button>
          </div>
        </div>
      ) : null}

      <AdminDataTable
        data={item.serviceLogs}
        columns={serviceLogColumns}
        searchColumnId="search"
        searchPlaceholder="Search service log..."
        emptyMessage="No service history logged yet for this item."
        initialSorting={[{ id: "serviceDate", desc: true }]}
        initialColumnVisibility={{ search: false }}
        initialColumnOrder={[
          "serviceType",
          "serviceDate",
          "warrantyUntil",
          "notes",
          "search",
          "actions",
        ]}
        invisibleColumns={["search"]}
        columnLabels={{
          serviceType: "service type",
          serviceDate: "service date",
          warrantyUntil: "warranty until",
          notes: "notes",
        }}
        filterTabs={serviceLogFilterTabs}
        stateResetKey={item.id}
        getRowClassName={() => "group align-top"}
      />

      <div className="flex justify-start">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openNewServiceLogEditor}
          className="border border-black dark:border-white"
        >
          <Plus className="mr-2 !h-[16px] !w-[16px]" />
          Add Row
        </Button>
      </div>
    </div>
  );
});
