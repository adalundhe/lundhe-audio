import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnSizingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs"
import { Courier_Prime } from 'next/font/google';
import { type EquipmentItem } from "~/server/api/routers/equipment";
import { ColumnResizer } from './ColumnResizer'
import { FilterCell, resetFilters } from './FilterCell'
import { ScrollArea } from "./ui/scroll-area"
import { GearNameCell } from "./GearNameCell"
import { Separator } from "./ui/separator"


const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})


export const columns: ColumnDef<EquipmentItem>[] = [
  {
    accessorKey: "id",
    enableHiding: true,
  },
  {
    id: "added",
    accessorFn: (row) => row.created_timestamp,
    filterFn: (row, _, filterValue: Date) => {

        const added = new Date(row.getValue("added"))
        const deltaMilliseconds = Math.abs(filterValue.getTime() - added.getTime())

        const total_seconds = Math.floor(deltaMilliseconds / 1000);
        const total_minutes = Math.floor(total_seconds / 60);
        const total_hours = Math.floor(total_minutes / 60);

        return Math.floor(total_hours / 24) < 30

    },
    enableHiding: true,
  },
  {
    accessorKey: "group",
    enableHiding: true,
    filterFn: "equalsString",
  },
  {
    id: "updated",
    accessorFn: (row) => row.updated_timestamp,
    enableHiding: true,
  },
  {
    accessorKey: "name",
    minSize: 300,
    maxSize: 700,
    enableMultiSort: true,
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
    cell: ({ row }) => <GearNameCell row={row} />,
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
      <div className="truncate text-ellipsis">{row.getValue("description")}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "type",
    minSize: 100,
    maxSize: 150,
    enableMultiSort: true,
    filterFn: "equalsString",
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
    cell: ({ row }) => <div className="lowercase truncate text-ellipsis">{row.getValue("type")}</div>,
  },
  {
    accessorKey: "quantity",
    minSize: 100,
    maxSize: 150,
    enableMultiSort: true,
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
    cell: ({ row }) => <div className="lowercase">{row.getValue("quantity")}</div>,
  },
  {
    accessorKey: "manufacturer",
    enableHiding: true,
    filterFn: "equalsString",
  }
]

export const GearTable = ({
    data
}: {
    data: EquipmentItem[]
}) => {
  
  const [sorting, setSorting] = React.useState<SortingState>([
      {
        id: "name",
        desc: false,
      }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
      id: false,
      added: false,
      updated: false,
      group: false,
      manufacturer: false,
    })
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
    initialState: {
      expanded: true,
      columnFilters: [
        {
          id: "type",
          value: ""
        }
      ]
    }
  })

  const dataByGroup = React.useMemo(() => data.reduce(function(grouped, item) {
    (grouped[item.group] ??= []).push(item);
    return grouped;
  }, {} as Record<string, EquipmentItem[]>), [data])

  const invisibleColumns = React.useRef<string[]>([
    "added",
    "updated",
    "id",
    "group",
    "manufacturer",
  ])

  const manufacturers = React.useMemo(() =>  [
      ...new Map(
          data.map(item => [item.manufacturer, item])
      ).keys()
  ].sort((manufacturerA, manufacturerB) => manufacturerA.toLocaleUpperCase().localeCompare(
    manufacturerB.toLocaleUpperCase()
  )), [data])

  const [activeTab, setActiveTab] = React.useState<'type' | 'brand'> ('type')

  const manufacturerGroups = React.useMemo(() => {
    return manufacturers.reduce((manufacturersMap, manufacturer) => {
      const groupKey = manufacturer.at(0)?.toLocaleUpperCase()

      if (groupKey && manufacturersMap.hasOwnProperty(groupKey)){
        manufacturersMap[groupKey]?.push(manufacturer)
      } else if (groupKey) {
        manufacturersMap[groupKey] = [manufacturer]
      }
      return manufacturersMap
      
    }, {} as Record<string, string[]>)

  }, [manufacturers])

  console.log(manufacturerGroups)

  return (
    <div className="w-full h-[600px]">
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
                Filter
                <div className="w-[1.5em] h-[1.5em]">
                  <ChevronDown />
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={`${courierPrime.className} py-0 px-0 h-[330px] w-[272px]`}>
          <Tabs 
            className="w-full"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'type' | 'brand')}
          >
            <TabsList className="w-full rounded-none p-0 h-full">
              <TabsTrigger value="type" className="rounded-none w-1/2">Type</TabsTrigger>
              <TabsTrigger value="brand" className="rounded-none w-1/2">Brand</TabsTrigger>
            </TabsList>
            <Separator className="w-full"/>
            <TabsContent value="type" className="mt-0 w-full h-[300px]">
                <ScrollArea className="h-full w-full px-4">
                  <Button
                    className="p-0 h-[2.5em] w-fit flex md:hover:underline hover:no-underline"
                    onClick={() => table.getColumn("added")?.setFilterValue(
                      table.getColumn("added")?.getFilterValue() === undefined ? new Date() : undefined
                    )}
                  >
                    <b>New!</b>
                  </Button>
                  <Separator/>
                    <Accordion type="single" collapsible className="flex flex-col w-full">
                    {
                      Object.keys(dataByGroup).map(group => 
                          <AccordionItem value={group} key={`equipment-group-${group}`}>
                            <AccordionTrigger className="h-[2.5em] w-fit flex md:hover:underline hover:no-underline" chevronSide="left">
                              {group}  
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <Separator className="w-1/4 mb-2"/>
                                <DropdownMenuCheckboxItem
                                    side="right"
                                    key={group}
                                    className="capitalize outline-none border-none w-full pl-0 hover:bg-white dark:hover:bg-black hover:underline"
                                    checked={
                                      (table.getColumn("group")?.getFilterValue() ?? "") === group
                                      && (table.getColumn("type")?.getFilterValue() ?? "") === ""
                                    }
                                    onCheckedChange={() => {
                                          resetFilters(table)
                                            const filter = (table.getColumn("type")?.getFilterValue() ?? "")
                                            const groupFilter = (table.getColumn("group")?.getFilterValue() ?? "")

                                            if (groupFilter === group && filter === "") {
                                              table.resetColumnFilters()
                                            } else {
                                              table.setColumnFilters([
                                                {
                                                  id: "group",
                                                  value: group,
                                                },
                                                {
                                                  id: "type",
                                                  value: "",
                                                }
                                              ])
                                        }
                                      }
                                    }
                                    
                                >
                                  <Button className="p-0 h-[1.5em]">
                                    all {group}
                                  </Button>
                                </DropdownMenuCheckboxItem>
                                {dataByGroup[group]?.map(item => item.type)
                                  .reduce(function (types, type) {
                                      if (!types.includes(type)) {
                                          types.push(type);
                                      }
                                      
                                      return types;
                                  }, [] as string[])
                                  .map((type) => {
                                    return (
                                      <DropdownMenuCheckboxItem
                                        side="right"
                                        key={type}
                                        className="capitalize outline-none border-none w-full pl-0 hover:bg-white dark:hover:bg-black hover:underline"
                                        checked={
                                          (table.getColumn("type")?.getFilterValue() ?? "") === type
                                        }
                                        onCheckedChange={() => {
                                            resetFilters(table)
                                            const filter = (table.getColumn("type")?.getFilterValue() ?? "")
                                            const groupFilter = (table.getColumn("group")?.getFilterValue() ?? "")

                                            if (groupFilter === group && filter === type) {
                                              table.resetColumnFilters()
                                            } else {
                                              table.setColumnFilters([
                                                {
                                                  id: "group",
                                                  value: group,
                                                },
                                                {
                                                  id: "type",
                                                  value: type,
                                                }
                                              ])
                                            }
              
                                          }
                                        }
                                      >
                                        <Button className="p-0 h-[1.5em]">
                                        {type}
                                        </Button>
                                      </DropdownMenuCheckboxItem>
                                    )
                                  })}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      }
                      </Accordion>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="brand" className="h-[300px] w-full mt-0">
                    <ScrollArea className="h-full w-full px-4">
                        <DropdownMenuCheckboxItem
                          side="right"
                          className={
                            `h-[2.5em] capitalize outline-none border-none w-full pl-0 hover:bg-white dark:hover:bg-black hover:underline ${(table.getColumn("manufacturer")?.getFilterValue() ?? "") === "" ? 'text-cyan-500 dark:hover:text-cyan-500 hover:text-cyan-500' : ''}`
                        }                             
                          checked={
                            (table.getColumn("manufacturer")?.getFilterValue() ?? "") === ""
                          }
                          onCheckedChange={() => resetFilters(table)}
                          
                      >
                        <Button className="p-0">
                          All
                        </Button>
                      </DropdownMenuCheckboxItem>
                    
                      <Separator/>
                      <Accordion type="single" collapsible className="flex flex-col w-full">
                      {
                      Object.keys(manufacturerGroups).sort().map(group => 
                          <AccordionItem value={group} key={`equipment-group-${group}`}>
                            <AccordionTrigger className="h-[2.5em] w-fit flex md:hover:underline hover:no-underline" chevronSide="left">
                              {group}  
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <Separator className="w-1/4 mb-2"/>
                                {manufacturerGroups[group]?.sort()
                                  .map((manufacturer, idx) => {
                                    return (
                                      <DropdownMenuCheckboxItem
                                        side="right"
                                        key={`${manufacturer}-${idx}`}
                                        className={
                                          `capitalize outline-none border-none w-full pl-0 hover:bg-white dark:hover:bg-black hover:underline ${(table.getColumn("manufacturer")?.getFilterValue() ?? "") === manufacturer ? 'text-cyan-500 dark:hover:text-cyan-500 hover:text-cyan-500' : ''}`
                                      }                             
                                        checked={
                                          (table.getColumn("manufacturer")?.getFilterValue() ?? "") === manufacturer
                                        }
                                        onCheckedChange={() => {
                                            resetFilters(table)
                                            const selectedManufacturer = (table.getColumn("manufacturer")?.getFilterValue() ?? "")

                                            if (manufacturer === selectedManufacturer) {
                                              table.resetColumnFilters()
                                            } else {
                                              table.setColumnFilters([
                                                {
                                                  id: "manufacturer",
                                                  value: manufacturer,
                                                }
                                              ])
                                            }
              
                                          }
                                        }
                                      >
                                        <Button className="p-0 h-[1.5em]">
                                        {manufacturer}
                                        </Button>
                                      </DropdownMenuCheckboxItem>
                                    )
                                  })}
                            </AccordionContent>
                          </AccordionItem>
                        )
                      }
                      </Accordion>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </DropdownMenuContent>
            </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-fit flex p-0 border-none outline-none">
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
              .filter((column) => column.getCanHide() && !invisibleColumns.current.includes(column.id))
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
        <div className="rounded-md border w-full">
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
                          row={row}
                          table={table}
                          filterColumn="type"
                          groupColumn="group"
                        /> 
                        :
                        <TableCell 
                          key={cell.id}
                          style={{
                            width: cell.column.getSize(),
                            minWidth: cell.column.columnDef.minSize
                          }}
                        >
                          {
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          }
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
      <div className="flex items-center justify-end py-4">
        <div className="w-1/3">
        {table.getState().pagination.pageIndex + 1} of{" "} {table.getPageCount()}
        </div>
        <div className="w-1/3 text-sm text-muted-foreground text-center">
          {table.getFilteredRowModel().rows.length} rows
        </div>
        <div className="space-x-2 w-1/3 flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            className="hover:underline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
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
  )
}
