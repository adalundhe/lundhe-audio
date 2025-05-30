"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnSizingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Courier_Prime, Scope_One } from 'next/font/google';
import { EquipmentItem} from "~/stores/gear-store";
import { ColumnResizer } from './ColumnResizer'
import { FilterCell } from './FilterCell'
import { ScrollArea } from "./ui/scroll-area"

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})
  



export const columns: ColumnDef<EquipmentItem>[] = [
  {
    accessorKey: "name",
    minSize: 300,
    maxSize: 700,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="w-fit flex px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <div className="w-fit h-full flex gap-4">
            Name
            <div className="w-[1.5em] h-[1.5em]">
              <ArrowUpDown />
            </div>
          </div>
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="capitalize h-[1vmax] truncate text-ellipsis">{row.getValue("name")}</div>
    ),
    enableHiding: false
  },
  {
    accessorKey: "description",
    minSize: 400,
    maxSize: 700,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="w-fit flex px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <div className="w-fit h-full flex gap-4">
            Description
          </div>
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className=" h-[1vmax] truncate text-ellipsis">{row.getValue("description")}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "type",
    minSize: 100,
    maxSize: 150,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="w-fit flex px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <div className="w-fit h-full flex gap-4">
            Type
            <div className="w-[1.5em] h-[1.5em]">
              <ArrowUpDown />
            </div>
          </div>
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase h-[1vmax] truncate text-ellipsis">{row.getValue("type")}</div>,
  },
  {
    accessorKey: "quantity",
    minSize: 100,
    maxSize: 150,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="w-fit flex px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <div className="w-fit h-full flex gap-4">
            Quantity
            <div className="w-[1.5em] h-[1.5em]">
              <ArrowUpDown />
            </div>
          </div>
        </Button>
      )
    },
    cell: ({ row }) => <div className="lowercase h-[1vmax]">{row.getValue("quantity")}</div>,
  },
]

export const GearTable = ({
    data
}: {
    data: EquipmentItem[]
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const [colSizing, setColSizing] = React.useState<ColumnSizingState>({});

  const table = useReactTable({
    data,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColSizing,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing: colSizing,
    },
  })
  

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center py-4 gap-x-8">
        <Input
          placeholder="Filter gear..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-md justify-self-start"
        />
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild className="p-0 ml-auto">
            <Button className="w-fit flex">
              <div className="w-fit h-full flex gap-4 items-center justify-center">
                Types
                <div className="w-[1.5em] h-[1.5em]">
                  <ChevronDown />
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={`${courierPrime.className}`}>
            <div>
              <ScrollArea className="h-[200px] w-full">

              {data.map(item => item.type)
              .reduce(function (types, type) {
                  if (!types.includes(type)) {
                      types.push(type);
                  }
                  
                  return types;
              }, [] as string[])
              .map((type) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={type}
                    className="capitalize"
                    checked={
                      table.getColumn("type")?.getFilterValue() === type
                    }
                    onCheckedChange={() => {
                      const filter = table.getColumn("type")?.getFilterValue()
                      table.getColumn("type")?.setFilterValue(
                        filter === type ?
                        ""
                        :
                        type
                      )
                    }
                      
                    }
                  >
                    {type}
                  </DropdownMenuCheckboxItem>
                )
              })}
              </ScrollArea>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-fit flex p-0">
              <div className="w-fit h-full flex gap-4 items-center justify-end">
                Columns
                <div className="w-[1.5em] h-[1.5em]">
                  <ChevronDown />
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={courierPrime.className}>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="w-full h-[420px]">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        className="relative"
                        style={{
                          width: header.column.getSize(),
                          minWidth: header.column.columnDef.minSize,
                          maxWidth: header.column.columnDef.maxSize,
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        <ColumnResizer header={header} />
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                        cell.getContext().column.id === 'type' ?  <FilterCell
                          key={cell.id}
                          cell={cell}
                          table={table}
                          filterColumn="type"
                        /> 
                        :
                        <TableCell 
                          key={cell.id}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize
                          }}
                          className="h-fit"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {table.getState().pagination.pageIndex + 1} of{" "} {table.getPageCount()}
        <div className="flex-1 text-sm text-muted-foreground">
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
