"use client";

import * as React from "react";
import { Courier_Prime } from "next/font/google";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnSizingState,
  functionalUpdate,
  type PaginationState,
  type Row,
  type SortingState,
  type Table as ReactTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown } from "lucide-react";

import { ColumnResizer } from "~/components/ColumnResizer";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ["latin"],
});

export type AdminDataTableColumnDef<TData> = ColumnDef<TData> & {
  id?: string;
  accessorKey?: string;
};

export interface AdminDataTableFilterTab<TData> {
  value: string;
  label: string;
  contentClassName?: string;
  render: (table: ReactTable<TData>) => React.ReactNode;
}

export function SortableHeader<TData>({
  column,
  label,
  align = "start",
}: {
  column: Column<TData, unknown>;
  label: string;
  align?: "start" | "end";
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "flex h-full min-h-10 w-full whitespace-nowrap px-0 hover:bg-transparent",
        align === "end" ? "justify-end text-right" : "justify-start text-left",
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <div
        className={cn(
          "flex h-full w-full min-w-0 items-center gap-3",
          align === "end" ? "justify-end" : "justify-start",
        )}
      >
        <span
          className={cn(
            "min-w-0 whitespace-nowrap leading-tight",
            align === "end" ? "text-right" : "text-left",
          )}
        >
          {label}
        </span>
        <div className="flex h-[1.5em] w-[1.5em] shrink-0 items-center justify-center">
          <ArrowUpDown className="h-[1.1em] w-[1.1em]" />
        </div>
      </div>
    </Button>
  );
}

export function SimpleFilterOption({
  active,
  label,
  onToggle,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <DropdownMenuCheckboxItem
      side="right"
      className={cn(
        "w-full pl-0 outline-none border-none hover:bg-white dark:hover:bg-black hover:underline",
        active && "text-cyan-500 dark:hover:text-cyan-500 hover:text-cyan-500",
      )}
      checked={active}
      onCheckedChange={onToggle}
    >
      <Button type="button" className="h-[1.5em] p-0">{label}</Button>
    </DropdownMenuCheckboxItem>
  );
}

export function FilterTabPanel({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <ScrollArea className={cn("h-full w-full px-4", className)}>
      {children}
    </ScrollArea>
  );
}

export function AdminDataTable<TData>({
  data,
  columns,
  searchColumnId,
  searchPlaceholder,
  emptyMessage,
  initialSorting = [],
  initialColumnVisibility = {},
  initialColumnOrder,
  invisibleColumns = [],
  columnLabels = {},
  filterTabs = [],
  getRowClassName,
  onRowClick,
  stateResetKey,
  paginationStorageKey,
}: {
  data: TData[];
  columns: AdminDataTableColumnDef<TData>[];
  searchColumnId: string;
  searchPlaceholder: string;
  emptyMessage: string;
  initialSorting?: SortingState;
  initialColumnVisibility?: VisibilityState;
  initialColumnOrder?: ColumnOrderState;
  invisibleColumns?: string[];
  columnLabels?: Record<string, string>;
  filterTabs?: AdminDataTableFilterTab<TData>[];
  getRowClassName?: (row: Row<TData>) => string | undefined;
  onRowClick?: (row: TData) => void;
  stateResetKey?: string | number;
  paginationStorageKey?: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    initialColumnOrder ?? [],
  );
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [activeTab, setActiveTab] = React.useState(
    filterTabs[0]?.value ?? "default",
  );
  const initialSortingRef = React.useRef(initialSorting);
  const initialColumnVisibilityRef = React.useRef(initialColumnVisibility);
  const initialColumnOrderRef = React.useRef(initialColumnOrder ?? []);
  const initialActiveTabRef = React.useRef(filterTabs[0]?.value ?? "default");
  const paginationHydratedRef = React.useRef(false);

  React.useEffect(() => {
    if (filterTabs.length === 0) {
      return;
    }

    if (!filterTabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(filterTabs[0]!.value);
    }
  }, [activeTab, filterTabs]);

  const invisibleColumnsRef = React.useRef(invisibleColumns);
  const handleSortingChange = React.useCallback(
    (updater: React.SetStateAction<SortingState>) => {
      setSorting((current) => functionalUpdate(updater, current));
      setPagination((current) =>
        current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
      );
    },
    [],
  );
  const handleColumnFiltersChange = React.useCallback(
    (updater: React.SetStateAction<ColumnFiltersState>) => {
      setColumnFilters((current) => functionalUpdate(updater, current));
      setPagination((current) =>
        current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
      );
    },
    [],
  );

  const table = useReactTable({
    data,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    autoResetPageIndex: false,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: handleColumnFiltersChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      columnSizing,
      pagination,
    },
  });

  React.useEffect(() => {
    if (!paginationStorageKey) {
      paginationHydratedRef.current = true;
      return;
    }

    try {
      const rawPagination = window.sessionStorage.getItem(paginationStorageKey);
      if (!rawPagination) {
        return;
      }

      const parsedPagination = JSON.parse(rawPagination) as Partial<PaginationState>;
      const nextPageIndex = Number(parsedPagination.pageIndex);
      const nextPageSize = Number(parsedPagination.pageSize);

      setPagination((current) => ({
        pageIndex:
          Number.isInteger(nextPageIndex) && nextPageIndex >= 0
            ? nextPageIndex
            : current.pageIndex,
        pageSize:
          Number.isInteger(nextPageSize) && nextPageSize > 0
            ? nextPageSize
            : current.pageSize,
      }));
    } catch {
      window.sessionStorage.removeItem(paginationStorageKey);
    } finally {
      paginationHydratedRef.current = true;
    }
  }, [paginationStorageKey]);

  React.useEffect(() => {
    if (!paginationStorageKey || !paginationHydratedRef.current) {
      return;
    }

    window.sessionStorage.setItem(
      paginationStorageKey,
      JSON.stringify(pagination),
    );
  }, [pagination, paginationStorageKey]);

  React.useEffect(() => {
    if (stateResetKey === undefined) {
      return;
    }

    setSorting(initialSortingRef.current);
    setColumnFilters([]);
    setColumnVisibility(initialColumnVisibilityRef.current);
    setColumnOrder(initialColumnOrderRef.current);
    setColumnSizing({});
    setPagination({ pageIndex: 0, pageSize: 10 });
    setActiveTab(initialActiveTabRef.current);
  }, [stateResetKey]);

  const pageCount = Math.max(table.getPageCount(), 1);

  React.useEffect(() => {
    const maxPageIndex = Math.max(pageCount - 1, 0);

    if (pagination.pageIndex <= maxPageIndex) {
      return;
    }

    setPagination((current) => ({
      ...current,
      pageIndex: maxPageIndex,
    }));
  }, [pageCount, pagination.pageIndex]);

  const visibleColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanHide() && !invisibleColumnsRef.current.includes(column.id),
    );
  const currentPage = table.getState().pagination.pageIndex + 1;
  const [pageJumpValue, setPageJumpValue] = React.useState(String(currentPage));

  React.useEffect(() => {
    setPageJumpValue(String(currentPage));
  }, [currentPage]);

  const commitPageJump = React.useCallback(
    (rawValue: string) => {
      const parsedPage = Number(rawValue);

      if (!Number.isFinite(parsedPage)) {
        setPageJumpValue(String(currentPage));
        return;
      }

      const nextPage = Math.min(Math.max(Math.trunc(parsedPage), 1), pageCount);
      table.setPageIndex(nextPage - 1);
      setPageJumpValue(String(nextPage));
    },
    [currentPage, pageCount, table],
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-3 py-4 sm:gap-x-8">
        <Input
          placeholder={searchPlaceholder}
          value={(table.getColumn(searchColumnId)?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn(searchColumnId)?.setFilterValue(event.target.value)
          }
          className="w-full max-w-md justify-self-start"
        />

        {filterTabs.length > 0 ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild className="p-0 sm:ml-auto">
              <Button type="button" className="w-fit flex">
                <div className="w-fit h-full flex gap-4 items-center justify-center">
                  Filter
                  <div className="h-[1.5em] w-[1.5em]">
                    <ChevronDown />
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(
                "h-[330px] w-[min(22rem,calc(100vw-2rem))] px-0 py-0",
                courierPrime.className,
              )}
            >
              <Tabs
                className="w-full"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList
                  className={cn(
                    "h-full w-full justify-start overflow-x-auto rounded-none p-0 [&>*]:shrink-0",
                    filterTabs.length === 1 && "grid-cols-1",
                  )}
                >
                  {filterTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-none px-4"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Separator className="w-full" />
                {filterTabs.map((tab) => (
                  <TabsContent
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "mt-0 h-[300px] w-full",
                      tab.contentClassName,
                    )}
                  >
                    {tab.render(table)}
                  </TabsContent>
                ))}
              </Tabs>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" className="w-fit flex p-0 border-none outline-none">
              <div className="w-fit h-full flex gap-4 items-center justify-end">
                  Columns
                  <div className="h-[1.5em] w-[1.5em]">
                    <ChevronDown />
                  </div>
                </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={courierPrime.className}>
            {visibleColumns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {columnLabels[column.id] ?? column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full overflow-x-auto rounded-md border">
        <table className="w-max min-w-full caption-bottom text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative whitespace-nowrap p-0 align-middle"
                    style={{
                      width: header.column.getSize(),
                      minWidth: header.column.columnDef.minSize,
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                  >
                    <div className="flex min-h-10 w-full items-center px-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </div>
                    <ColumnResizer
                      header={header}
                      enabled={header.index < headerGroup.headers.length - 1}
                    />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    onRowClick && "cursor-pointer",
                    getRowClassName?.(row),
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap"
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 py-4">
        <div className="min-w-[6rem] text-sm">
          {currentPage} of {pageCount}
        </div>
        <div className="min-w-[6rem] text-sm text-muted-foreground sm:text-center">
          {table.getFilteredRowModel().rows.length} rows
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={pageCount}
              value={pageJumpValue}
              onChange={(event) =>
                setPageJumpValue(event.target.value.replace(/[^\d]/g, ""))
              }
              onBlur={() => commitPageJump(pageJumpValue)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") {
                  return;
                }

                event.preventDefault();
                commitPageJump(pageJumpValue);
              }}
              className="h-8 w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={courierPrime.className}>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hover:underline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hover:underline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
