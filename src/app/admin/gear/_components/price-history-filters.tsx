"use client";

import * as React from "react";
import { Filter } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import {
  ChartFilterPanel,
  type ChartFilterGrouping,
  type ChartFilterOption,
} from "./chart-filter-panel";

type PriceHistoryFilterFacet = {
  label: string;
  options: ChartFilterOption[];
  selectedKeys: string[];
  onChange: (nextKeys: string[] | null) => void;
  grouping?: ChartFilterGrouping;
};

const isFacetActive = (facet: PriceHistoryFilterFacet) =>
  facet.selectedKeys.length !== facet.options.length;

const getFacetSummary = (facet: PriceHistoryFilterFacet) =>
  isFacetActive(facet) ? `${facet.selectedKeys.length}/${facet.options.length}` : "All";

export function PriceHistoryFilters({
  facets,
}: {
  facets: PriceHistoryFilterFacet[];
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const populatedFacets = React.useMemo(
    () => facets.filter((facet) => facet.options.length > 0),
    [facets],
  );
  const activeFacetCount = React.useMemo(
    () => populatedFacets.filter(isFacetActive).length,
    [populatedFacets],
  );

  if (populatedFacets.length === 0) {
    return null;
  }

  const resetAllFilters = () => {
    for (const facet of populatedFacets) {
      facet.onChange(null);
    }
  };

  return (
    <>
      <div className="hidden md:block">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" variant="ghost" className="border">
              <Filter className="!h-[16px] !w-[16px]" />
              Filters
              {activeFacetCount > 0 ? ` (${activeFacetCount})` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-1">
            <div className="flex items-center justify-between gap-2 px-2 py-2">
              <div className="text-sm font-medium">Price History Filters</div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 border px-2 text-xs"
                onClick={resetAllFilters}
              >
                Reset
              </Button>
            </div>
            {populatedFacets.map((facet) => (
              <DropdownMenuSub key={facet.label}>
                <DropdownMenuSubTrigger className="justify-between" iconStyles="!ml-1">
                  <span>{facet.label}</span>
                  <DropdownMenuShortcut>{getFacetSummary(facet)}</DropdownMenuShortcut>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-[22rem] p-0">
                    <ChartFilterPanel
                      label={facet.label}
                      options={facet.options}
                      selectedKeys={facet.selectedKeys}
                      onChange={facet.onChange}
                      grouping={facet.grouping}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="md:hidden">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="border"
          onClick={() => setMobileOpen(true)}
        >
          <Filter className="!h-[16px] !w-[16px]" />
          Filters
          {activeFacetCount > 0 ? ` (${activeFacetCount})` : ""}
        </Button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="bottom"
            className="h-[85vh] rounded-t-lg border-t bg-background/95 px-3 pb-4 pt-6 supports-[backdrop-filter]:bg-background/90"
          >
            <SheetTitle className="sr-only">Price history filters</SheetTitle>
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <div>
                  <div className="text-sm font-medium">Price History Filters</div>
                  <div className="text-xs text-muted-foreground">
                    Filter by source, title, model, make, year, condition, and category.
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 border px-2 text-xs"
                  onClick={resetAllFilters}
                >
                  Reset
                </Button>
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                <Accordion type="multiple">
                  {populatedFacets.map((facet) => (
                    <AccordionItem key={facet.label} value={facet.label} className="border-b">
                      <AccordionTrigger
                        chevronSide="none"
                        className="w-full justify-between px-1 py-3 hover:no-underline"
                      >
                        <div className="flex min-w-0 items-center gap-2 text-left">
                          <span className="font-medium">{facet.label}</span>
                          <span
                            className={cn(
                              "text-xs text-muted-foreground",
                              isFacetActive(facet) && "text-foreground",
                            )}
                          >
                            {getFacetSummary(facet)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3 pt-0">
                        <div className="overflow-hidden rounded-md border">
                          <ChartFilterPanel
                            label={facet.label}
                            options={facet.options}
                            selectedKeys={facet.selectedKeys}
                            onChange={facet.onChange}
                            grouping={facet.grouping}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
