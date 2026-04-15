"use client";

import * as React from "react";
import { type Table as ReactTable } from "@tanstack/react-table";
import { Check } from "lucide-react";

import {
  type AdminDataTableColumnDef,
  FilterTabPanel,
  SimpleFilterOption,
  SortableHeader,
} from "~/app/admin/_components/admin-data-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";
import {
  type ManifestGearItem,
} from "./manifest-manager-types";
import { gearStatusMetadata } from "~/app/admin/gear/_components/gear-manager-types";

const normalizeOptionValue = (value: string) => value.trim().toLocaleLowerCase();

const normalizeCurrency = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Number(parsed.toFixed(2));
};

const normalizeQuantity = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.trunc(parsed);
};

const isRecentlyAdded = (createdTimestamp: string): boolean => {
  const added = new Date(createdTimestamp);
  const deltaMilliseconds = Math.abs(Date.now() - added.getTime());
  const totalHours = Math.floor(deltaMilliseconds / 1000 / 60 / 60);
  return Math.floor(totalHours / 24) < 30;
};

const groupOptionsAlphabetically = (options: string[]) =>
  options.reduce(
    (grouped, option) => {
      const normalizedOption = option.trim();
      if (!normalizedOption) {
        return grouped;
      }

      const groupKey = normalizedOption.at(0)?.toLocaleUpperCase() ?? "#";
      grouped[groupKey] ??= [];
      grouped[groupKey].push(normalizedOption);
      return grouped;
    },
    {} as Record<string, string[]>,
  );

const resetInventoryFilters = (table: ReactTable<ManifestGearItem>) => {
  table.getColumn("group")?.setFilterValue("");
  table.getColumn("type")?.setFilterValue("");
  table.getColumn("manufacturer")?.setFilterValue("");
  table.getColumn("location")?.setFilterValue("");
};

const clearInventoryTableFilters = (table: ReactTable<ManifestGearItem>) => {
  resetInventoryFilters(table);
  table.getColumn("added")?.setFilterValue(undefined);
  table.getColumn("search")?.setFilterValue("");
};

const hasActiveInventoryFilters = (table: ReactTable<ManifestGearItem>) =>
  ((table.getColumn("search")?.getFilterValue() ?? "") as string).trim() !== "" ||
  (table.getColumn("added")?.getFilterValue() ?? undefined) !== undefined ||
  ((table.getColumn("group")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("type")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("manufacturer")?.getFilterValue() ?? "") as string) !== "" ||
  ((table.getColumn("location")?.getFilterValue() ?? "") as string) !== "";

export function useManifestGearTableConfig({
  gear,
  selectable = false,
  selectedIds = [],
  onToggleSelected,
}: {
  gear: ManifestGearItem[];
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelected?: (id: string, next: boolean) => void;
}) {
  const selectedIdSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const gearByGroup = React.useMemo(
    () =>
      gear.reduce(
        (grouped, item) => {
          const key = item.group.trim() || "Uncategorized";
          grouped[key] ??= [];
          grouped[key]!.push(item);
          return grouped;
        },
        {} as Record<string, ManifestGearItem[]>,
      ),
    [gear],
  );

  const manufacturerGroups = React.useMemo(
    () =>
      groupOptionsAlphabetically(
        [...new Map(
          gear
            .map((item) => item.manufacturer.trim())
            .filter(Boolean)
            .map((value) => [normalizeOptionValue(value), value]),
        ).values()].sort((left, right) => left.localeCompare(right)),
      ),
    [gear],
  );

  const availableLocations = React.useMemo(
    () =>
      [...new Map(
        gear
          .map((item) => item.location.trim())
          .filter(Boolean)
          .map((value) => [normalizeOptionValue(value), value]),
      ).values()].sort((left, right) => left.localeCompare(right)),
    [gear],
  );

  const columns = React.useMemo<AdminDataTableColumnDef<ManifestGearItem>[]>(() => {
    const baseColumns: AdminDataTableColumnDef<ManifestGearItem>[] = [
      {
        id: "status",
        accessorKey: "status",
        enableSorting: false,
        enableHiding: false,
        size: 48,
        minSize: 48,
        maxSize: 48,
        header: () => <div className="w-full" />,
        cell: ({ row }) => {
          const metadata = gearStatusMetadata[row.original.status];

          return (
            <div className="flex items-center justify-center">
              <span
                aria-label={metadata.label}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  metadata.dotClassName,
                  (row.original.status === "active" ||
                    row.original.status === "out-of-order") &&
                    "animate-pulse",
                )}
                title={metadata.label}
              />
            </div>
          );
        },
      },
      {
        id: "added",
        accessorFn: (row) => row.created_timestamp,
        filterFn: (row, _, filterValue: Date) => {
          const added = new Date(row.getValue("added"));
          const deltaMilliseconds = Math.abs(
            filterValue.getTime() - added.getTime(),
          );
          const totalHours = Math.floor(deltaMilliseconds / 1000 / 60 / 60);
          return Math.floor(totalHours / 24) < 30;
        },
        enableHiding: true,
      },
      {
        accessorKey: "name",
        size: 280,
        minSize: 220,
        maxSize: 420,
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 truncate text-sm font-medium">
            <span className="truncate">{row.original.name}</span>
            {isRecentlyAdded(row.original.created_timestamp) ? (
              <Badge variant="outline">NEW!</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "description",
        size: 420,
        minSize: 300,
        maxSize: 640,
        enableSorting: false,
        header: () => (
          <div className="flex h-full w-full items-center justify-start gap-3 text-left text-muted-foreground">
            Description
          </div>
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.description}
          </div>
        ),
      },
      {
        accessorKey: "manufacturer",
        filterFn: "equalsString",
        size: 180,
        minSize: 140,
        maxSize: 260,
        header: ({ column }) => (
          <SortableHeader column={column} label="Manufacturer" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.manufacturer ?? "—"}</div>
        ),
      },
      {
        accessorKey: "location",
        filterFn: "equalsString",
        size: 220,
        minSize: 160,
        maxSize: 320,
        header: ({ column }) => <SortableHeader column={column} label="Location" />,
        cell: ({ row }) => (
          <div className="truncate text-sm">{row.original.location || "—"}</div>
        ),
      },
      {
        accessorKey: "type",
        filterFn: "equalsString",
        size: 140,
        minSize: 110,
        maxSize: 180,
        header: ({ column }) => <SortableHeader column={column} label="Type" />,
        cell: ({ row, table }) => {
          const typeValue = row.original.type;
          const groupValue = row.original.group;
          const typeFilter = (table.getColumn("type")?.getFilterValue() ?? "") as string;
          const groupFilter = (table.getColumn("group")?.getFilterValue() ?? "") as string;

          return (
            <Button
              type="button"
              className={cn(
                "h-fit p-0 hover:text-cyan-500",
                (typeFilter === typeValue || groupFilter === groupValue) &&
                  "text-cyan-500",
              )}
              onClick={(event) => {
                event.stopPropagation();

                if (typeFilter === typeValue) {
                  clearInventoryTableFilters(table);
                  return;
                }

                table.setColumnFilters([{ id: "type", value: typeValue }]);
              }}
            >
              <div className="truncate text-sm lowercase">{typeValue}</div>
            </Button>
          );
        },
      },
      {
        accessorKey: "group",
        filterFn: "equalsString",
        size: 150,
        minSize: 120,
        maxSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Group" />,
        cell: ({ row, table }) => {
          const groupValue = row.original.group;
          const groupFilter = (table.getColumn("group")?.getFilterValue() ?? "") as string;
          const typeFilter = (table.getColumn("type")?.getFilterValue() ?? "") as string;

          return (
            <Button
              type="button"
              className={cn(
                "h-fit p-0 hover:text-cyan-500",
                groupFilter === groupValue && "text-cyan-500",
              )}
              onClick={(event) => {
                event.stopPropagation();

                if (groupFilter === groupValue && typeFilter === "") {
                  clearInventoryTableFilters(table);
                  return;
                }

                table.setColumnFilters([{ id: "group", value: groupValue }]);
              }}
            >
              <div className="truncate text-sm">{groupValue}</div>
            </Button>
          );
        },
      },
      {
        accessorKey: "price",
        size: 120,
        minSize: 100,
        maxSize: 160,
        header: ({ column }) => (
          <SortableHeader column={column} label="Price" align="end" />
        ),
        cell: ({ row }) => {
          const price = normalizeCurrency(row.original.price);
          return <div className="text-right text-sm">${price.toFixed(2)}</div>;
        },
      },
      {
        accessorKey: "quantity",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <SortableHeader column={column} label="Qty" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">{normalizeQuantity(row.original.quantity)}</div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [
            row.status,
            row.name,
            row.description,
            row.manufacturer,
            row.location,
            row.serialNumber,
            row.acquiredFrom,
            row.purchaseSource,
            row.referenceNumber,
            row.type,
            row.group,
            row.notes,
            String(row.price),
          ].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
    ];

    if (!selectable || !onToggleSelected) {
      return baseColumns;
    }

    return [
      {
        id: "selected",
        accessorFn: (row) => (selectedIdSet.has(row.id) ? 1 : 0),
        enableSorting: false,
        enableHiding: false,
        size: 48,
        minSize: 48,
        maxSize: 48,
        header: () => <div className="w-full" />,
        cell: ({ row }) => {
          const isSelected = selectedIdSet.has(row.original.id);

          return (
            <div
              className="flex items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) =>
                  onToggleSelected(row.original.id, checked === true)
                }
                aria-label={`${isSelected ? "Remove" : "Add"} ${row.original.name}`}
              />
            </div>
          );
        },
      },
      ...baseColumns,
      {
        id: "selected-state",
        enableSorting: false,
        enableHiding: false,
        size: 70,
        minSize: 70,
        maxSize: 70,
        header: () => <div className="w-fit" />,
        cell: ({ row }) =>
          selectedIdSet.has(row.original.id) ? (
            <div className="flex justify-end text-cyan-500">
              <Check className="!h-[16px] !w-[16px]" />
            </div>
          ) : (
            <div className="flex justify-end" />
          ),
      },
    ];
  }, [gear, onToggleSelected, selectable, selectedIdSet]);

  const filterTabs = React.useMemo(
    () => [
      {
        value: "type",
        label: "Type",
        render: (table: ReactTable<ManifestGearItem>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={!hasActiveInventoryFilters(table)}
              label="All"
              onToggle={() => clearInventoryTableFilters(table)}
            />
            <Button
              type="button"
              className={cn(
                "h-[2.5em] w-fit p-0 flex md:hover:underline hover:no-underline",
                table.getColumn("added")?.getFilterValue() !== undefined &&
                  "text-cyan-500 hover:text-cyan-500 dark:hover:text-cyan-500",
              )}
              onClick={() =>
                table.getColumn("added")?.setFilterValue(
                  table.getColumn("added")?.getFilterValue() === undefined
                    ? new Date()
                    : undefined,
                )
              }
            >
              <b>New!</b>
            </Button>
            <Separator />
            <Accordion type="single" collapsible className="flex w-full flex-col">
              {Object.keys(gearByGroup)
                .sort((left, right) => left.localeCompare(right))
                .map((group) => {
                  const groupItems = gearByGroup[group] ?? [];
                  const groupedTypes = [
                    ...new Map(
                      groupItems.map((item) => [
                        normalizeOptionValue(item.type),
                        item.type,
                      ]),
                    ).values(),
                  ].sort((left, right) => left.localeCompare(right));

                  return (
                    <AccordionItem key={`manifest-gear-group-${group}`} value={group}>
                      <AccordionTrigger
                        chevronSide="none"
                        className="h-[2.5em] w-full justify-between md:hover:underline hover:no-underline"
                      >
                        {group}
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        <Separator className="mb-2 w-1/4" />
                        <SimpleFilterOption
                          active={
                            (table.getColumn("group")?.getFilterValue() ?? "") === group &&
                            (table.getColumn("type")?.getFilterValue() ?? "") === ""
                          }
                          label={`all ${group}`}
                          onToggle={() => {
                            const typeFilter =
                              (table.getColumn("type")?.getFilterValue() ?? "") as string;
                            const groupFilter =
                              (table.getColumn("group")?.getFilterValue() ?? "") as string;

                            if (groupFilter === group && typeFilter === "") {
                              clearInventoryTableFilters(table);
                            } else {
                              resetInventoryFilters(table);
                              table.setColumnFilters([{ id: "group", value: group }]);
                            }
                          }}
                        />
                        {groupedTypes.map((type) => (
                          <SimpleFilterOption
                            key={`${group}-${type}`}
                            active={
                              (table.getColumn("group")?.getFilterValue() ?? "") ===
                                group &&
                              (table.getColumn("type")?.getFilterValue() ?? "") === type
                            }
                            label={type}
                            onToggle={() => {
                              const typeFilter =
                                (table.getColumn("type")?.getFilterValue() ?? "") as string;
                              const groupFilter =
                                (table.getColumn("group")?.getFilterValue() ?? "") as string;

                              if (groupFilter === group && typeFilter === type) {
                                clearInventoryTableFilters(table);
                              } else {
                                resetInventoryFilters(table);
                                table.setColumnFilters([
                                  { id: "group", value: group },
                                  { id: "type", value: type },
                                ]);
                              }
                            }}
                          />
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          </FilterTabPanel>
        ),
      },
      {
        value: "brand",
        label: "Brand",
        render: (table: ReactTable<ManifestGearItem>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={!hasActiveInventoryFilters(table)}
              label="All"
              onToggle={() => clearInventoryTableFilters(table)}
            />
            <Separator />
            <Accordion type="single" collapsible className="flex w-full flex-col">
              {Object.keys(manufacturerGroups)
                .sort((left, right) => left.localeCompare(right))
                .map((group) => (
                  <AccordionItem
                    key={`manifest-manufacturer-group-${group}`}
                    value={group}
                  >
                    <AccordionTrigger
                      chevronSide="none"
                      className="h-[2.5em] w-full justify-between md:hover:underline hover:no-underline"
                    >
                      {group}
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      <Separator className="mb-2 w-1/4" />
                      {manufacturerGroups[group]
                        ?.slice()
                        .sort((left, right) => left.localeCompare(right))
                        .map((manufacturer) => (
                          <SimpleFilterOption
                            key={manufacturer}
                            active={
                              (table.getColumn("manufacturer")?.getFilterValue() ?? "") ===
                              manufacturer
                            }
                            label={manufacturer}
                            onToggle={() => {
                              const selectedManufacturer =
                                (table.getColumn("manufacturer")?.getFilterValue() ??
                                  "") as string;

                              if (selectedManufacturer === manufacturer) {
                                clearInventoryTableFilters(table);
                              } else {
                                resetInventoryFilters(table);
                                table.setColumnFilters([
                                  { id: "manufacturer", value: manufacturer },
                                ]);
                              }
                            }}
                          />
                        ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </FilterTabPanel>
        ),
      },
      {
        value: "location",
        label: "Location",
        render: (table: ReactTable<ManifestGearItem>) => (
          <FilterTabPanel>
            <SimpleFilterOption
              active={(table.getColumn("location")?.getFilterValue() ?? "") === ""}
              label="All"
              onToggle={() => table.getColumn("location")?.setFilterValue("")}
            />
            <Separator />
            {availableLocations.map((location) => (
              <SimpleFilterOption
                key={location}
                active={
                  (table.getColumn("location")?.getFilterValue() ?? "") === location
                }
                label={location}
                onToggle={() =>
                  table.getColumn("location")?.setFilterValue(
                    (table.getColumn("location")?.getFilterValue() ?? "") === location
                      ? ""
                      : location,
                  )
                }
              />
            ))}
          </FilterTabPanel>
        ),
      },
    ],
    [availableLocations, gearByGroup, manufacturerGroups],
  );

  return {
    columns,
    filterTabs,
  };
}
