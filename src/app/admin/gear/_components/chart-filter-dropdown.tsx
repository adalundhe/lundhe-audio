"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

export type ChartFilterOption = { key: string; label: string };

const normalizeOptionValue = (value: string) => value.trim().toLocaleLowerCase();

const getChartYearValue = (label: string) => {
  const match = label.match(/\d{4}/);
  return match ? Number(match[0]) : Number.NaN;
};

const sortChartFilterOptionsAlphabetically = (
  options: ChartFilterOption[],
) =>
  [...options].sort((left, right) =>
    left.label.localeCompare(right.label, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

const sortChartFilterOptionsByYear = (options: ChartFilterOption[]) =>
  [...options].sort((left, right) => {
    const leftYear = getChartYearValue(left.label);
    const rightYear = getChartYearValue(right.label);
    const leftHasYear = Number.isFinite(leftYear);
    const rightHasYear = Number.isFinite(rightYear);

    if (leftHasYear && rightHasYear) {
      return leftYear - rightYear || left.label.localeCompare(right.label);
    }

    if (leftHasYear) return -1;
    if (rightHasYear) return 1;

    return left.label.localeCompare(right.label, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const groupChartFilterOptionsAlphabetically = (options: ChartFilterOption[]) =>
  sortChartFilterOptionsAlphabetically(options).reduce(
    (grouped, option) => {
      const groupKey = option.label.trim().at(0)?.toLocaleUpperCase() ?? "#";
      grouped[groupKey] ??= [];
      grouped[groupKey].push(option);
      return grouped;
    },
    {} as Record<string, ChartFilterOption[]>,
  );

const groupChartFilterOptionsByDecade = (options: ChartFilterOption[]) =>
  sortChartFilterOptionsByYear(options).reduce(
    (grouped, option) => {
      const yearValue = getChartYearValue(option.label);
      const groupKey = Number.isFinite(yearValue)
        ? `${Math.floor(yearValue / 10) * 10}s`
        : "Unknown";
      grouped[groupKey] ??= [];
      grouped[groupKey].push(option);
      return grouped;
    },
    {} as Record<string, ChartFilterOption[]>,
  );

export function ChartFilterDropdown({
  label,
  options,
  selectedKeys,
  onChange,
  grouping = "alpha",
}: {
  label: string;
  options: ChartFilterOption[];
  selectedKeys: string[] | null;
  onChange: (nextKeys: string[] | null) => void;
  grouping?: "alpha" | "decade";
}) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const normalizedSearchValue = normalizeOptionValue(searchValue);
  const sortedOptions = React.useMemo(
    () =>
      grouping === "decade"
        ? sortChartFilterOptionsByYear(options)
        : sortChartFilterOptionsAlphabetically(options),
    [grouping, options],
  );
  const filteredOptions = React.useMemo(
    () =>
      normalizedSearchValue
        ? sortedOptions.filter((option) =>
            normalizeOptionValue(option.label).includes(normalizedSearchValue),
          )
        : sortedOptions,
    [normalizedSearchValue, sortedOptions],
  );
  const groupedOptions = React.useMemo(
    () =>
      grouping === "decade"
        ? groupChartFilterOptionsByDecade(filteredOptions)
        : groupChartFilterOptionsAlphabetically(filteredOptions),
    [filteredOptions, grouping],
  );
  const groupEntries = React.useMemo(
    () =>
      Object.entries(groupedOptions)
        .sort(([left], [right]) => {
          if (grouping === "decade") {
            const leftYear = getChartYearValue(left);
            const rightYear = getChartYearValue(right);
            const leftHasYear = Number.isFinite(leftYear);
            const rightHasYear = Number.isFinite(rightYear);

            if (leftHasYear && rightHasYear) {
              return leftYear - rightYear;
            }

            if (leftHasYear) return -1;
            if (rightHasYear) return 1;
            return left.localeCompare(right);
          }

          if (left === "#" && right !== "#") return 1;
          if (right === "#" && left !== "#") return -1;
          return left.localeCompare(right);
        })
        .map(([groupKey, groupOptions]) => ({
          groupKey,
          groupOptions,
        })),
    [groupedOptions, grouping],
  );
  const allOptionKeys = React.useMemo(
    () => options.map((option) => option.key),
    [options],
  );
  const isFilterInactive = selectedKeys === null;
  const effectiveSelectedKeys = React.useMemo(
    () => selectedKeys ?? allOptionKeys,
    [allOptionKeys, selectedKeys],
  );
  const visibleOptionKeys = filteredOptions.map((option) => option.key);
  const selectedVisibleCount = visibleOptionKeys.filter((key) =>
    effectiveSelectedKeys.includes(key),
  ).length;
  const allSelected =
    isFilterInactive || effectiveSelectedKeys.length === options.length;

  if (options.length === 0) {
    return null;
  }

  const setUniqueKeys = (nextKeys: string[]) => {
    const uniqueKeys = [...new Set(nextKeys)].filter((key) =>
      allOptionKeys.includes(key),
    );

    if (uniqueKeys.length === 0) {
      onChange([]);
      return;
    }

    if (uniqueKeys.length === allOptionKeys.length) {
      onChange(null);
      return;
    }

    onChange(uniqueKeys);
  };

  const toggleOption = (key: string, checked: boolean) => {
    setUniqueKeys(
      checked
        ? [...effectiveSelectedKeys, key]
        : effectiveSelectedKeys.filter((selectedKey) => selectedKey !== key),
    );
  };

  const toggleGroup = (groupKeys: string[], checked: boolean) => {
    setUniqueKeys(
      checked
        ? [...effectiveSelectedKeys, ...groupKeys]
        : effectiveSelectedKeys.filter(
            (selectedKey) => !groupKeys.includes(selectedKey),
          ),
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSearchValue("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="border">
          {label}
          {!allSelected ? ` (${effectiveSelectedKeys.length}/${options.length})` : ""}
          <ChevronDown className="ml-2 !h-[16px] !w-[16px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="space-y-3 border-b px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">{label}</div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 border px-2 text-xs"
                onClick={() => onChange(null)}
              >
                Select All
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 border px-2 text-xs"
                onClick={() => onChange([])}
              >
                Clear
              </Button>
            </div>
          </div>
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={`Filter ${label.toLocaleLowerCase()}...`}
          />
          {normalizedSearchValue ? (
            <div className="text-xs text-muted-foreground">
              Showing {filteredOptions.length} of {options.length} options.{" "}
              {selectedVisibleCount} selected.
            </div>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {groupEntries.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              No matches for the current filter.
            </div>
          ) : (
            <Accordion
              type="multiple"
              className="w-full"
              defaultValue={groupEntries.map((entry) => entry.groupKey)}
            >
              {groupEntries.map(({ groupKey, groupOptions }) => {
                const groupKeys = groupOptions.map((option) => option.key);
                const selectedGroupCount = groupKeys.filter((key) =>
                  effectiveSelectedKeys.includes(key),
                ).length;

                return (
                  <AccordionItem key={groupKey} value={groupKey} className="border-b">
                    <AccordionTrigger
                      chevronSide="none"
                      className="w-full justify-between px-3 py-2 hover:no-underline"
                    >
                      <div className="flex min-w-0 items-center gap-2 text-left">
                        <span className="font-medium">{groupKey}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedGroupCount}/{groupOptions.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-0">
                      <div className="space-y-2 border-t px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 border px-2 text-xs"
                            onClick={() => toggleGroup(groupKeys, true)}
                          >
                            Select {groupKey}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 border px-2 text-xs"
                            onClick={() => toggleGroup(groupKeys, false)}
                          >
                            Clear {groupKey}
                          </Button>
                        </div>
                        <div className="flex flex-col rounded-md border">
                          {groupOptions.map((option, index) => {
                            const checked = effectiveSelectedKeys.includes(option.key);

                            return (
                              <div
                                key={option.key}
                                role="button"
                                tabIndex={0}
                                className={cn(
                                  "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  index > 0 && "border-t",
                                )}
                                onClick={() => toggleOption(option.key, !checked)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    toggleOption(option.key, !checked);
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={checked}
                                  className="pointer-events-none"
                                />
                                <span className="min-w-0 truncate">
                                  {option.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
