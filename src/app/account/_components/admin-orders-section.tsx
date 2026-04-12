"use client";

import * as React from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnSizingState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowUpDown, ChevronDown, Loader2 } from "lucide-react";

import { ColumnResizer } from "~/components/ColumnResizer";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import type { AdminOrderListItem } from "~/server/orders";
import { api } from "~/trpc/react";
import type { OrderWorkflowStatus } from "~/types/orders";

type OrderServiceType =
  | "mixing"
  | "mastering"
  | "mixing-and-mastering"
  | "studio-service";

type AdminOrdersColumnDef = ColumnDef<AdminOrderListItem> & {
  id?: string;
  accessorKey?: string;
};

const workflowStatusValues: OrderWorkflowStatus[] = [
  "awaiting-files",
  "queued",
  "in-progress",
  "awaiting-feedback",
  "revision-in-progress",
  "completed",
  "on-hold",
  "cancelled",
];

const workflowStatusLabels: Record<OrderWorkflowStatus, string> = {
  "awaiting-files": "Awaiting Files",
  queued: "Queued",
  "in-progress": "In Progress",
  "awaiting-feedback": "Awaiting Feedback",
  "revision-in-progress": "Revision In Progress",
  completed: "Completed",
  "on-hold": "On Hold",
  cancelled: "Cancelled",
};

const workflowStatusBadgeClassNames: Record<OrderWorkflowStatus, string> = {
  "awaiting-files":
    "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  queued:
    "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  "in-progress":
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "awaiting-feedback":
    "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "revision-in-progress":
    "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
  completed:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "on-hold":
    "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  cancelled:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

const serviceTypeLabels: Record<OrderServiceType, string> = {
  mixing: "Mixing",
  mastering: "Mastering",
  "mixing-and-mastering": "Mixing + Mastering",
  "studio-service": "Studio Service",
};

const defaultColumnVisibility: VisibilityState = {
  service: false,
  name: false,
  reference: false,
  subtotal: false,
  discount: false,
  search: false,
  recent: false,
  serviceType: false,
};

const defaultColumnOrder: ColumnOrderState = [
  "order",
  "customer",
  "orderedAt",
  "itemCount",
  "total",
  "paymentStatus",
  "status",
  "service",
  "name",
  "reference",
  "subtotal",
  "discount",
  "search",
  "recent",
  "serviceType",
];

const invisibleColumns = new Set(["search", "recent", "serviceType"]);
const sessionSongCountPattern = /\((\d+)\s+song(?:s)?\)\s*$/i;

const stripServiceMetadata = (name: string) =>
  name.replace(sessionSongCountPattern, "").trim();

const getOrderNames = (order: AdminOrderListItem) => {
  const uniqueNames = new Set(
    order.items.map((item) => stripServiceMetadata(item.name)).filter(Boolean),
  );

  return [...uniqueNames];
};

const getServiceType = (order: AdminOrderListItem): OrderServiceType => {
  const names = order.items.map((item) => item.name.toLowerCase());
  const hasMixing = names.some((name) => /\bmix(ing)?\b/.test(name));
  const hasMastering = names.some((name) => /\bmaster(ing)?\b/.test(name));

  if (hasMixing && hasMastering) {
    return "mixing-and-mastering";
  }

  if (hasMixing) {
    return "mixing";
  }

  if (hasMastering) {
    return "mastering";
  }

  return "studio-service";
};

const getDisplayServices = (
  order: AdminOrderListItem,
): Exclude<OrderServiceType, "mixing-and-mastering">[] => {
  const serviceType = getServiceType(order);

  if (serviceType === "mixing-and-mastering") {
    return ["mixing", "mastering"];
  }

  return [serviceType];
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
};

const formatOrderDate = (value: string) => format(new Date(value), "MMM d, yyyy");

const getRelativeDate = (value: string) =>
  formatDistanceToNowStrict(new Date(value), { addSuffix: true });

const formatPaymentStatusLabel = (status: string) =>
  status
    .split(/[-_]/g)
    .map((segment) =>
      segment.length > 0
        ? segment[0]!.toUpperCase() + segment.slice(1).toLowerCase()
        : segment,
    )
    .join(" ");

const handleSortToggle = (column: Column<any, unknown>) => {
  const direction = column.getIsSorted();

  if (direction === "asc") {
    column.toggleSorting(true);
    return;
  }

  if (direction === "desc") {
    column.clearSorting();
    return;
  }

  column.toggleSorting(false);
};

const SortableHeader = ({
  column,
  label,
  align = "start",
}: {
  column: Column<any, unknown>;
  label: string;
  align?: "start" | "end";
}) => (
  <Button
    variant="ghost"
    className={cn(
      "flex h-auto w-full whitespace-nowrap px-0 hover:bg-transparent",
      align === "end" ? "justify-end text-right" : "justify-start text-left",
    )}
    onClick={() => handleSortToggle(column)}
  >
    <div
      className={cn(
        "flex h-full w-full min-w-0 items-center gap-3",
        align === "end" ? "justify-end" : "justify-start",
      )}
    >
      <span className="min-w-0 whitespace-nowrap text-left leading-tight">
        {label}
      </span>
      <div className="flex h-[1.5em] w-[1.5em] shrink-0 items-center justify-center">
        <ArrowUpDown className="h-[1.1em] w-[1.1em]" />
      </div>
    </div>
  </Button>
);

const WorkflowStatusBadge = ({
  status,
  className,
}: {
  status: OrderWorkflowStatus;
  className?: string;
}) => (
  <Badge
    variant="outline"
    className={cn("font-medium", workflowStatusBadgeClassNames[status], className)}
  >
    {workflowStatusLabels[status]}
  </Badge>
);

function StatusBadgeEditor({
  order,
  isPending,
  onStatusChange,
}: {
  order: AdminOrderListItem;
  isPending: boolean;
  onStatusChange: (orderId: string, value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const closeTimerRef = React.useRef<number | null>(null);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 120);
  }, [clearCloseTimer]);

  React.useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer],
  );

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onMouseEnter={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          onFocus={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onBlur={scheduleClose}
        >
          <WorkflowStatusBadge
            status={order.workflowStatus}
            className={cn(isPending && "opacity-60")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-60 p-2"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Update Status
            </p>
            <p className="text-xs text-muted-foreground">
              Hover or focus the badge to edit.
            </p>
          </div>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        <div className="grid gap-1">
          {workflowStatusValues.map((status) => (
            <Button
              key={status}
              type="button"
              variant="ghost"
              className={cn(
                "h-auto justify-start px-2 py-2 text-left",
                order.workflowStatus === status && "text-cyan-500",
              )}
              disabled={isPending}
              onClick={() => {
                onStatusChange(order.id, status);
                setOpen(false);
              }}
            >
              {workflowStatusLabels[status]}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const resetFilters = (table: ReturnType<typeof useReactTable<AdminOrderListItem>>) => {
  if (table.getColumn("recent")?.getFilterValue() !== undefined) {
    table.getColumn("recent")?.setFilterValue(undefined);
  }

  for (const columnId of ["status", "paymentStatus", "serviceType"] as const) {
    if ((table.getColumn(columnId)?.getFilterValue() ?? "") !== "") {
      table.getColumn(columnId)?.setFilterValue("");
    }
  }
};

const columnLabels: Record<string, string> = {
  order: "order",
  customer: "customer",
  orderedAt: "date",
  itemCount: "quantity",
  total: "total",
  paymentStatus: "payment",
  status: "status",
  service: "service",
  name: "name",
  reference: "reference",
  subtotal: "subtotal",
  discount: "discount",
};

export function AdminOrdersSection({
  initialOrders,
}: {
  initialOrders: AdminOrderListItem[];
}) {
  const [orders, setOrders] = React.useState<AdminOrderListItem[]>(initialOrders);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "orderedAt",
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);
  const [columnOrder, setColumnOrder] =
    React.useState<ColumnOrderState>(defaultColumnOrder);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [activeTab, setActiveTab] = React.useState<
    "status" | "payment" | "service"
  >("status");

  const updateMutation = api.adminOrders.updateWorkflowStatus.useMutation({
    onMutate: ({ orderId }) => {
      setError(null);
      setPendingId(orderId);
    },
    onSuccess: ({ id, workflowStatus }) => {
      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, workflowStatus } : order,
        ),
      );
    },
    onError: (err) => {
      setError(err.message);
    },
    onSettled: () => {
      setPendingId(null);
    },
  });

  const handleStatusChange = React.useCallback(
    (orderId: string, value: string) => {
      if (!workflowStatusValues.includes(value as OrderWorkflowStatus)) {
        return;
      }

      updateMutation.mutate({
        orderId,
        workflowStatus: value as OrderWorkflowStatus,
      });
    },
    [updateMutation],
  );

  const columns = React.useMemo<AdminOrdersColumnDef[]>(
    () => [
      {
        id: "order",
        accessorFn: (row) => row.id,
        size: 170,
        minSize: 140,
        maxSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Order" />,
        cell: ({ row }) => (
          <div className="flex min-h-12 flex-col justify-center gap-1">
            <p className="font-mono text-sm font-medium">
              #{row.original.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        id: "customer",
        accessorFn: (row) => row.customerEmail ?? "",
        size: 260,
        minSize: 200,
        maxSize: 360,
        header: ({ column }) => (
          <SortableHeader column={column} label="Customer" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-sm">
            {row.original.customerEmail ?? (
              <span className="text-muted-foreground">unknown</span>
            )}
          </div>
        ),
      },
      {
        id: "orderedAt",
        accessorFn: (row) => new Date(row.orderedAt).getTime(),
        size: 170,
        minSize: 140,
        maxSize: 220,
        header: ({ column }) => <SortableHeader column={column} label="Date" />,
        cell: ({ row }) => (
          <div className="flex min-h-12 flex-col justify-center gap-1">
            <p className="font-medium">{formatOrderDate(row.original.orderedAt)}</p>
            <p className="text-xs text-muted-foreground">
              {getRelativeDate(row.original.orderedAt)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "itemCount",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <SortableHeader column={column} label="Qty" align="end" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-right font-medium">
            {row.original.itemCount}
          </div>
        ),
      },
      {
        accessorKey: "total",
        size: 150,
        minSize: 120,
        maxSize: 190,
        header: ({ column }) => (
          <SortableHeader column={column} label="Total" align="end" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-right font-medium">
            {formatCurrency(row.original.total, row.original.currency)}
          </div>
        ),
      },
      {
        accessorKey: "paymentStatus",
        filterFn: "equalsString",
        size: 170,
        minSize: 130,
        maxSize: 220,
        header: ({ column }) => (
          <SortableHeader column={column} label="Payment" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-sm">
            {formatPaymentStatusLabel(row.original.paymentStatus)}
          </div>
        ),
      },
      {
        accessorKey: "workflowStatus",
        id: "status",
        filterFn: "equalsString",
        size: 180,
        minSize: 150,
        maxSize: 240,
        header: ({ column }) => (
          <SortableHeader column={column} label="Status" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1">
            <StatusBadgeEditor
              order={row.original}
              isPending={pendingId === row.original.id}
              onStatusChange={handleStatusChange}
            />
          </div>
        ),
      },
      {
        id: "service",
        accessorFn: (row) => getServiceType(row),
        filterFn: "equalsString",
        size: 180,
        minSize: 150,
        maxSize: 240,
        header: ({ column }) => (
          <SortableHeader column={column} label="Service" />
        ),
        cell: ({ row }) => (
          <div className="flex min-h-12 items-center gap-2 py-1">
            {getDisplayServices(row.original).map((service) => (
              <Badge key={service} variant="outline" className="w-fit">
                {serviceTypeLabels[service]}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "name",
        accessorFn: (row) => getOrderNames(row).join(" "),
        size: 280,
        minSize: 220,
        maxSize: 420,
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => {
          const names = getOrderNames(row.original);
          const visibleNames = names.slice(0, 2);
          const remainingNames = names.length - visibleNames.length;

          return (
            <div className="flex min-h-12 flex-col justify-center gap-1.5 py-1">
              {visibleNames.map((name) => (
                <p key={name} className="whitespace-nowrap leading-snug">
                  {name}
                </p>
              ))}
              {remainingNames > 0 ? (
                <p className="text-xs text-muted-foreground">
                  +{remainingNames} more name{remainingNames > 1 ? "s" : ""}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "reference",
        accessorFn: (row) => row.checkoutSessionId,
        size: 220,
        minSize: 180,
        maxSize: 320,
        header: ({ column }) => (
          <SortableHeader column={column} label="Reference" />
        ),
        cell: ({ row }) => (
          <div className="flex min-h-12 flex-col justify-center gap-1 py-1">
            <p className="font-mono text-sm font-medium">
              #{row.original.checkoutSessionId.slice(-8).toUpperCase()}
            </p>
            <p className="whitespace-nowrap text-xs text-muted-foreground">
              {row.original.checkoutSessionId}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "subtotal",
        size: 140,
        minSize: 110,
        maxSize: 170,
        header: ({ column }) => (
          <SortableHeader column={column} label="Subtotal" align="end" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-right">
            {formatCurrency(row.original.subtotal, row.original.currency)}
          </div>
        ),
      },
      {
        accessorKey: "discount",
        size: 140,
        minSize: 110,
        maxSize: 170,
        header: ({ column }) => (
          <SortableHeader column={column} label="Discount" align="end" />
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "min-h-12 py-1 text-right",
              row.original.discount > 0 &&
                "text-emerald-600 dark:text-emerald-400",
            )}
          >
            {formatCurrency(row.original.discount, row.original.currency)}
          </div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [
            row.id,
            row.checkoutSessionId,
            row.customerEmail ?? "",
            getOrderNames(row).join(" "),
          ].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
      {
        id: "recent",
        accessorFn: (row) => row.orderedAt,
        filterFn: (row, _, filterValue: Date) => {
          const orderedAt = new Date(row.getValue("recent"));
          const deltaMilliseconds = Math.abs(
            filterValue.getTime() - orderedAt.getTime(),
          );

          return Math.floor(deltaMilliseconds / (1000 * 60 * 60 * 24)) < 30;
        },
        enableHiding: true,
      },
      {
        id: "serviceType",
        accessorFn: (row) => getServiceType(row),
        filterFn: "equalsString",
        enableHiding: true,
      },
    ],
    [handleStatusChange, pendingId],
  );

  const table = useReactTable({
    data: orders,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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

  const serviceTypes = React.useMemo(
    () =>
      [...new Set(orders.map((order) => getServiceType(order)))].sort((a, b) =>
        serviceTypeLabels[a].localeCompare(serviceTypeLabels[b]),
      ),
    [orders],
  );

  const paymentStatuses = React.useMemo(
    () =>
      [...new Set(orders.map((order) => order.paymentStatus))].sort((a, b) =>
        formatPaymentStatusLabel(a).localeCompare(formatPaymentStatusLabel(b)),
      ),
    [orders],
  );

  const visibleColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanHide() && !invisibleColumns.has(column.id),
    );

  const rows = table.getRowModel().rows;
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Admin · All Orders</CardTitle>
        <CardDescription>
          {orders.length} order{orders.length === 1 ? "" : "s"} across every
          customer. Hover a status badge to change it.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-4 py-4">
              <Input
                placeholder="Search orders, customers, or references..."
                value={
                  (table.getColumn("search")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("search")?.setFilterValue(event.target.value)
                }
                className="w-full max-w-md"
              />

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild className="ml-auto p-0">
                  <Button className="w-fit">
                    <div className="flex items-center justify-center gap-4">
                      Filter
                      <div className="h-[1.5em] w-[1.5em]">
                        <ChevronDown />
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="h-[320px] w-[280px] px-0 py-0"
                >
                  <Tabs
                    className="w-full"
                    value={activeTab}
                    onValueChange={(value) =>
                      setActiveTab(value as "status" | "payment" | "service")
                    }
                  >
                    <TabsList className="h-full w-full rounded-none p-0">
                      <TabsTrigger value="status" className="w-1/3 rounded-none">
                        Status
                      </TabsTrigger>
                      <TabsTrigger value="payment" className="w-1/3 rounded-none">
                        Payment
                      </TabsTrigger>
                      <TabsTrigger value="service" className="w-1/3 rounded-none">
                        Service
                      </TabsTrigger>
                    </TabsList>
                    <Separator className="w-full" />

                    <TabsContent value="status" className="mt-0 h-[290px] w-full">
                      <ScrollArea className="h-full w-full px-4">
                        <Button
                          className="h-[2.5em] w-fit p-0 hover:no-underline md:hover:underline"
                          onClick={() =>
                            table
                              .getColumn("recent")
                              ?.setFilterValue(
                                table.getColumn("recent")?.getFilterValue() ===
                                  undefined
                                  ? new Date()
                                  : undefined,
                              )
                          }
                        >
                          <b>Recent</b>
                        </Button>
                        <Separator />
                        <DropdownMenuCheckboxItem
                          side="right"
                          checked={
                            (table.getColumn("status")?.getFilterValue() ?? "") ===
                              "" &&
                            table.getColumn("recent")?.getFilterValue() ===
                              undefined
                          }
                          className={
                            (table.getColumn("status")?.getFilterValue() ?? "") ===
                              "" &&
                            table.getColumn("recent")?.getFilterValue() ===
                              undefined
                              ? "text-cyan-500"
                              : ""
                          }
                          onCheckedChange={() => resetFilters(table)}
                        >
                          <Button className="p-0">All</Button>
                        </DropdownMenuCheckboxItem>
                        <Separator />
                        {workflowStatusValues.map((status) => (
                          <DropdownMenuCheckboxItem
                            side="right"
                            key={status}
                            checked={
                              (table.getColumn("status")?.getFilterValue() ?? "") ===
                              status
                            }
                            className={
                              (table.getColumn("status")?.getFilterValue() ?? "") ===
                              status
                                ? "text-cyan-500"
                                : ""
                            }
                            onCheckedChange={() => {
                              const selectedStatus =
                                table.getColumn("status")?.getFilterValue() ?? "";

                              resetFilters(table);
                              table
                                .getColumn("status")
                                ?.setFilterValue(
                                  selectedStatus === status ? "" : status,
                                );
                            }}
                          >
                            <Button className="p-0">{workflowStatusLabels[status]}</Button>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="payment" className="mt-0 h-[290px] w-full">
                      <ScrollArea className="h-full w-full px-4">
                        <DropdownMenuCheckboxItem
                          side="right"
                          checked={
                            (table.getColumn("paymentStatus")?.getFilterValue() ??
                              "") === ""
                          }
                          className={
                            (table.getColumn("paymentStatus")?.getFilterValue() ??
                              "") === ""
                              ? "text-cyan-500"
                              : ""
                          }
                          onCheckedChange={() => resetFilters(table)}
                        >
                          <Button className="p-0">All</Button>
                        </DropdownMenuCheckboxItem>
                        <Separator />
                        {paymentStatuses.map((status) => (
                          <DropdownMenuCheckboxItem
                            side="right"
                            key={status}
                            checked={
                              (table.getColumn("paymentStatus")?.getFilterValue() ??
                                "") === status
                            }
                            className={
                              (table.getColumn("paymentStatus")?.getFilterValue() ??
                                "") === status
                                ? "text-cyan-500"
                                : ""
                            }
                            onCheckedChange={() => {
                              const selectedPayment =
                                table.getColumn("paymentStatus")?.getFilterValue() ??
                                "";

                              resetFilters(table);
                              table
                                .getColumn("paymentStatus")
                                ?.setFilterValue(
                                  selectedPayment === status ? "" : status,
                                );
                            }}
                          >
                            <Button className="p-0">
                              {formatPaymentStatusLabel(status)}
                            </Button>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="service" className="mt-0 h-[290px] w-full">
                      <ScrollArea className="h-full w-full px-4">
                        <DropdownMenuCheckboxItem
                          side="right"
                          checked={
                            (table.getColumn("serviceType")?.getFilterValue() ??
                              "") === ""
                          }
                          className={
                            (table.getColumn("serviceType")?.getFilterValue() ??
                              "") === ""
                              ? "text-cyan-500"
                              : ""
                          }
                          onCheckedChange={() => resetFilters(table)}
                        >
                          <Button className="p-0">All</Button>
                        </DropdownMenuCheckboxItem>
                        <Separator />
                        {serviceTypes.map((serviceType) => (
                          <DropdownMenuCheckboxItem
                            side="right"
                            key={serviceType}
                            checked={
                              (table.getColumn("serviceType")?.getFilterValue() ??
                                "") === serviceType
                            }
                            className={
                              (table.getColumn("serviceType")?.getFilterValue() ??
                                "") === serviceType
                                ? "text-cyan-500"
                                : ""
                            }
                            onCheckedChange={() => {
                              const selectedService =
                                table.getColumn("serviceType")?.getFilterValue() ??
                                "";

                              resetFilters(table);
                              table
                                .getColumn("serviceType")
                                ?.setFilterValue(
                                  selectedService === serviceType
                                    ? ""
                                    : serviceType,
                                );
                            }}
                          >
                            <Button className="p-0">
                              {serviceTypeLabels[serviceType]}
                            </Button>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-fit border-none p-0 outline-none">
                    <div className="flex items-center justify-end gap-4">
                      Columns
                      <div className="h-[1.5em] w-[1.5em]">
                        <ChevronDown />
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {visibleColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {columnLabels[column.id] ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <div className="grid gap-3 md:hidden">
                {rows.length > 0 ? (
                  rows.map((row) => {
                    const order = row.original;

                    return (
                      <div
                        key={order.id}
                        className="rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-medium">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.customerEmail ?? "unknown"}
                            </p>
                          </div>
                          <StatusBadgeEditor
                            order={order}
                            isPending={pendingId === order.id}
                            onStatusChange={handleStatusChange}
                          />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Date
                            </p>
                            <p className="text-sm">{formatOrderDate(order.orderedAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Total
                            </p>
                            <p className="text-sm">
                              {formatCurrency(order.total, order.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Payment
                            </p>
                            <p className="text-sm">
                              {formatPaymentStatusLabel(order.paymentStatus)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Qty
                            </p>
                            <p className="text-sm">{order.itemCount}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-md border px-4 py-6 text-center text-sm text-muted-foreground">
                    No results.
                  </div>
                )}
              </div>

              <div className="hidden md:block">
                <div className="w-full overflow-x-auto rounded-md border">
                  <table className="w-max min-w-full caption-bottom text-sm">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className={cn(
                                "relative align-top py-3 whitespace-nowrap after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-muted last:after:hidden",
                                ["itemCount", "total", "subtotal", "discount"].includes(
                                  header.column.id,
                                ) && "text-right",
                              )}
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
                                    header.getContext(),
                                  )}
                              <ColumnResizer
                                header={header}
                                enabled={
                                  header.index < headerGroup.headers.length - 1
                                }
                              />
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {rows.length > 0 ? (
                        rows.map((row) => (
                          <TableRow key={row.id} className="hover:bg-muted/40">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell
                                key={cell.id}
                                className={cn(
                                  "align-top py-4 whitespace-nowrap",
                                  ["itemCount", "total", "subtotal", "discount"].includes(
                                    cell.column.id,
                                  ) && "text-right",
                                )}
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
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end py-4">
              <div className="w-1/3">
                {table.getState().pagination.pageIndex + 1} of {pageCount}
              </div>
              <div className="w-1/3 text-center text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} rows
              </div>
              <div className="flex w-1/3 items-center justify-end space-x-2">
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
        )}
      </CardContent>
    </Card>
  );
}
