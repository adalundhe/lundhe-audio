"use client";

import * as React from "react";
import { Filter, ChevronDown } from "lucide-react";
import { type Table as ReactTable } from "@tanstack/react-table";

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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import type { AdminDataTableFilterTab } from "./admin-data-table";

export function AdminTableFilterControls<TData>({
  table,
  filterTabs,
  menuClassName,
}: {
  table: ReactTable<TData>;
  filterTabs: AdminDataTableFilterTab<TData>[];
  menuClassName?: string;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (filterTabs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="hidden md:block sm:ml-auto">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button type="button" className="w-fit">
              <Filter className="!h-[16px] !w-[16px]" />
              Filters
              <ChevronDown className="!h-[16px] !w-[16px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1">
            <div className="px-2 py-2 text-sm font-medium">Filters</div>
            {filterTabs.map((tab) => (
              <DropdownMenuSub key={tab.value}>
                <DropdownMenuSubTrigger className="justify-between">
                  <span>{tab.label}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-[22rem] p-0">
                    <div className={menuClassName}>{tab.render(table)}</div>
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
        </Button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="bottom"
            className="h-[85vh] rounded-t-lg border-t bg-background/95 px-3 pb-4 pt-6 supports-[backdrop-filter]:bg-background/90"
          >
            <SheetTitle className="sr-only">Table filters</SheetTitle>
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b pb-3">
                <div className="text-sm font-medium">Filters</div>
                <div className="text-xs text-muted-foreground">
                  Filter the current table by category-specific controls.
                </div>
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                <Accordion type="multiple">
                  {filterTabs.map((tab) => (
                    <AccordionItem key={tab.value} value={tab.value} className="border-b">
                      <AccordionTrigger
                        chevronSide="none"
                        className="w-full justify-between px-1 py-3 hover:no-underline"
                      >
                        <span className="font-medium">{tab.label}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-3 pt-0">
                        <div className="overflow-hidden rounded-md border">
                          <div className={menuClassName}>{tab.render(table)}</div>
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
