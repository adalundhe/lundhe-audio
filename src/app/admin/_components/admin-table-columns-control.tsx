"use client";

import * as React from "react";
import { ChevronDown, Columns3 } from "lucide-react";
import { type Column } from "@tanstack/react-table";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { AdminCheckboxRow } from "./admin-checkbox-row";

export function AdminTableColumnsControl<TData>({
  columns,
  columnLabels,
  menuClassName,
}: {
  columns: Column<TData, unknown>[];
  columnLabels: Record<string, string>;
  menuClassName?: string;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (columns.length === 0) {
    return null;
  }

  return (
    <>
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" className="w-fit border-none p-0">
              Columns
              <ChevronDown className="!h-[16px] !w-[16px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={menuClassName}>
            {columns.map((column) => (
              <AdminCheckboxRow
                key={column.id}
                checked={column.getIsVisible()}
                label={columnLabels[column.id] ?? column.id}
                onToggle={() => column.toggleVisibility(!column.getIsVisible())}
                className="capitalize"
              />
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
          <Columns3 className="!h-[16px] !w-[16px]" />
          Columns
        </Button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="bottom"
            className="h-[75vh] rounded-t-lg border-t bg-background/95 px-3 pb-4 pt-6 supports-[backdrop-filter]:bg-background/90"
          >
            <SheetTitle className="sr-only">Table columns</SheetTitle>
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b pb-3">
                <div className="text-sm font-medium">Columns</div>
                <div className="text-xs text-muted-foreground">
                  Show or hide columns for the current table.
                </div>
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="overflow-hidden rounded-md border">
                  {columns.map((column, index) => (
                    <AdminCheckboxRow
                      key={column.id}
                      checked={column.getIsVisible()}
                      label={columnLabels[column.id] ?? column.id}
                      onToggle={() =>
                        column.toggleVisibility(!column.getIsVisible())
                      }
                      className={index > 0 ? "border-t capitalize" : "capitalize"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
