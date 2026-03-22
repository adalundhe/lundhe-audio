"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type PaginationState,
  type ColumnSizingState,
  type SortingState,
  type Table,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";

import { ColumnResizer } from "~/components/ColumnResizer";
import { useRouteTransition } from "~/components/route-transition-provider";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
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
import type { OrderListItem, OrderWorkflowStatus } from "~/types/orders";

type OrderServiceType =
  | "mixing"
  | "mastering"
  | "mixing-and-mastering"
  | "studio-service";

type OrdersColumnDef = ColumnDef<OrderListItem> & {
  id?: string;
  accessorKey?: string;
  size?: number;
  minSize?: number;
  maxSize?: number;
};

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

const serviceTypeLabels: Record<OrderServiceType, string> = {
  mixing: "Mixing",
  mastering: "Mastering",
  "mixing-and-mastering": "Mixing + Mastering",
  "studio-service": "Studio Service",
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

const defaultColumnVisibility: VisibilityState = {
  recent: false,
  serviceType: false,
  songCount: false,
  itemCount: false,
  subtotal: false,
  discount: false,
  customerEmail: false,
  paymentStatus: false,
};

const defaultColumnOrder: ColumnOrderState = [
  "service",
  "name",
  "songCount",
  "itemCount",
  "status",
  "orderedAt",
  "total",
  "checkoutSessionId",
  "subtotal",
  "discount",
  "paymentStatus",
  "customerEmail",
  "recent",
  "serviceType",
];

const getColumnId = (column: OrdersColumnDef) => {
  if (typeof column.id === "string") {
    return column.id;
  }

  if (typeof column.accessorKey === "string") {
    return column.accessorKey;
  }

  return null;
};

const getServiceType = (order: OrderListItem): OrderServiceType => {
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
  order: OrderListItem,
): Exclude<OrderServiceType, "mixing-and-mastering">[] => {
  const serviceType = getServiceType(order);

  if (serviceType === "mixing-and-mastering") {
    return ["mixing", "mastering"];
  }

  return [serviceType];
};

const sessionSongCountPattern = /\((\d+)\s+song(?:s)?\)\s*$/i;

const stripServiceMetadata = (name: string) =>
  name.replace(sessionSongCountPattern, "").trim();

const getSongCountFromItemName = (name: string) => {
  const match = name.match(sessionSongCountPattern);

  return match?.[1] ? Number(match[1]) : 0;
};

const getOrderSongCount = (order: OrderListItem) =>
  order.items.reduce(
    (total, item) => total + getSongCountFromItemName(item.name) * item.quantity,
    0,
  );

const getOrderNames = (order: OrderListItem) => {
  const uniqueNames = new Set(
    order.items.map((item) => stripServiceMetadata(item.name)).filter(Boolean),
  );

  return [...uniqueNames];
};

const resetFilters = (table: Table<OrderListItem>) => {
  const recentColumn = table.getColumn("recent");
  if (recentColumn?.getFilterValue() !== undefined) {
    recentColumn.setFilterValue(undefined);
  }

  const serviceTypeColumn = table.getColumn("serviceType");
  if ((serviceTypeColumn?.getFilterValue() ?? "") !== "") {
    serviceTypeColumn?.setFilterValue("");
  }

  const statusColumn = table.getColumn("status");
  if ((statusColumn?.getFilterValue() ?? "") !== "") {
    statusColumn?.setFilterValue("");
  }
};

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);

const formatOrderDate = (value: string) =>
  format(new Date(value), "MMM d, yyyy");

const getRelativeDate = (value: string) =>
  formatDistanceToNowStrict(new Date(value), { addSuffix: true });

const WorkflowStatusBadge = ({
  status,
}: {
  status: OrderWorkflowStatus;
}) => (
  <Badge
    variant="outline"
    className={cn("font-medium", workflowStatusBadgeClassNames[status])}
  >
    {workflowStatusLabels[status]}
  </Badge>
);

const SortIcon = ({ direction }: { direction: false | "asc" | "desc" }) => {
  if (direction === "asc") {
    return <ArrowUp className="h-[1.1em] w-[1.1em]" />;
  }

  if (direction === "desc") {
    return <ArrowDown className="h-[1.1em] w-[1.1em]" />;
  }

  return <ArrowUpDown className="h-[1.1em] w-[1.1em]" />;
};

type CellAlignment = "start" | "end";

const alignedColumnIds = new Set<string>();

const getCellAlignment = (columnId: string): CellAlignment =>
  alignedColumnIds.has(columnId) ? "end" : "start";

const getTableCellClassName = (columnId: string) =>
  cn(
    "align-top py-4 whitespace-normal [overflow-wrap:anywhere]",
    getCellAlignment(columnId) === "end" && "text-right",
  );

const CellStack = ({
  align = "start",
  className,
  children,
}: React.PropsWithChildren<{
  align?: CellAlignment;
  className?: string;
}>) => (
  <div
    className={cn(
      "flex min-h-12 w-full min-w-0 flex-col justify-start gap-1.5 overflow-hidden whitespace-normal [overflow-wrap:anywhere]",
      align === "end" ? "items-end text-right" : "items-start text-left",
      className,
    )}
  >
    {children}
  </div>
);

const CellValue = ({
  align = "start",
  className,
  children,
}: React.PropsWithChildren<{
  align?: CellAlignment;
  className?: string;
}>) => (
  <div
    className={cn(
      "flex min-h-12 w-full min-w-0 items-start overflow-hidden whitespace-normal [overflow-wrap:anywhere]",
      align === "end" ? "justify-end text-right" : "justify-start text-left",
      className,
    )}
  >
    {children}
  </div>
);

const SortableHeader = ({
  column,
  label,
  align = "start",
}: {
  column: Column<OrderListItem, unknown>;
  label: string;
  align?: CellAlignment;
}) => (
  <Button
    variant="ghost"
    className={cn(
      "flex h-auto w-full whitespace-normal px-0 hover:bg-transparent",
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
      <span className="min-w-0 break-words text-left leading-tight">
        {label}
      </span>
      <div
        className={cn(
          "flex h-[1.5em] w-[1.5em] shrink-0 items-center justify-center",
          column.getIsSorted() && "text-foreground",
        )}
      >
        <SortIcon direction={column.getIsSorted()} />
      </div>
    </div>
  </Button>
);

const OrdersServiceCell = ({ order }: { order: OrderListItem }) => {
  const services = getDisplayServices(order);

  return (
    <CellValue className="flex-wrap gap-2">
      {services.map((service) => (
        <Badge key={service} variant="outline" className="w-fit">
          {serviceTypeLabels[service]}
        </Badge>
      ))}
    </CellValue>
  );
};

const OrdersNameCell = ({ order }: { order: OrderListItem }) => {
  const names = getOrderNames(order);
  const visibleNames = names.slice(0, 2);
  const remainingNames = names.length - visibleNames.length;

  return (
    <CellStack className="min-w-0 gap-2">
      {visibleNames.map((name) => (
        <div key={name} className="flex min-w-0 items-start">
          <p className="min-w-0 break-words leading-snug">{name}</p>
        </div>
      ))}
      {remainingNames > 0 && (
        <p className="text-xs text-muted-foreground">
          +{remainingNames} more name{remainingNames > 1 ? "s" : ""}
        </p>
      )}
    </CellStack>
  );
};

const columns: OrdersColumnDef[] = [
  {
    id: "service",
    accessorFn: (row) => getServiceType(row),
    size: 170,
    minSize: 130,
    maxSize: 240,
    filterFn: "equalsString",
    header: ({ column }) => <SortableHeader column={column} label="Service" />,
    cell: ({ row }) => <OrdersServiceCell order={row.original} />,
  },
  {
    id: "name",
    accessorFn: (row) => getOrderNames(row).join(" "),
    size: 320,
    minSize: 220,
    maxSize: 520,
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
    cell: ({ row }) => <OrdersNameCell order={row.original} />,
  },
  {
    id: "songCount",
    accessorFn: (row) => getOrderSongCount(row),
    size: 90,
    minSize: 70,
    maxSize: 120,
    header: ({ column }) => <SortableHeader column={column} label="Songs" />,
    cell: ({ row }) => {
      const songCount = getOrderSongCount(row.original);

      return (
        <CellValue>
          <span className="whitespace-nowrap font-medium">
            {songCount > 0 ? songCount : "\u2014"}
          </span>
        </CellValue>
      );
    },
  },
  {
    accessorKey: "itemCount",
    size: 90,
    minSize: 70,
    maxSize: 120,
    header: ({ column }) => <SortableHeader column={column} label="Qty" />,
    cell: ({ row }) => (
      <CellValue>
        <span className="whitespace-nowrap font-medium">
          {row.original.itemCount}
        </span>
      </CellValue>
    ),
  },
  {
    accessorKey: "workflowStatus",
    id: "status",
    size: 150,
    minSize: 120,
    maxSize: 220,
    filterFn: "equalsString",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => (
      <CellValue>
        <WorkflowStatusBadge status={row.original.workflowStatus} />
      </CellValue>
    ),
  },
  {
    id: "orderedAt",
    accessorFn: (row) => new Date(row.orderedAt).getTime(),
    size: 180,
    minSize: 140,
    maxSize: 240,
    header: ({ column }) => <SortableHeader column={column} label="Date" />,
    cell: ({ row }) => (
      <CellStack className="min-w-0">
        <p className="font-medium">{formatOrderDate(row.original.orderedAt)}</p>
        <p className="text-xs text-muted-foreground">
          {getRelativeDate(row.original.orderedAt)}
        </p>
      </CellStack>
    ),
  },
  {
    accessorKey: "total",
    size: 150,
    minSize: 120,
    maxSize: 210,
    header: ({ column }) => <SortableHeader column={column} label="Total" />,
    cell: ({ row }) => (
      <CellValue>
        <span className="whitespace-nowrap font-medium">
          {formatCurrency(row.original.total, row.original.currency)}
        </span>
      </CellValue>
    ),
  },
  {
    accessorKey: "checkoutSessionId",
    size: 210,
    minSize: 160,
    maxSize: 320,
    header: ({ column }) => (
      <SortableHeader column={column} label="Reference" />
    ),
    cell: ({ row }) => (
      <CellStack className="min-w-0">
        <p className="font-mono text-sm font-medium">
          #{row.original.checkoutSessionId.slice(-8).toUpperCase()}
        </p>
        <p className="break-all text-xs leading-snug text-muted-foreground">
          {row.original.checkoutSessionId}
        </p>
      </CellStack>
    ),
  },
  {
    accessorKey: "subtotal",
    size: 140,
    minSize: 110,
    maxSize: 170,
    header: ({ column }) => <SortableHeader column={column} label="Subtotal" />,
    cell: ({ row }) => (
      <CellValue>
        <span className="whitespace-nowrap">
          {formatCurrency(row.original.subtotal, row.original.currency)}
        </span>
      </CellValue>
    ),
  },
  {
    accessorKey: "discount",
    size: 140,
    minSize: 110,
    maxSize: 170,
    header: ({ column }) => <SortableHeader column={column} label="Discount" />,
    cell: ({ row }) => (
      <CellValue>
        <span
          className={cn(
            "whitespace-nowrap",
            row.original.discount > 0 &&
              "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {formatCurrency(row.original.discount, row.original.currency)}
        </span>
      </CellValue>
    ),
  },
  {
    accessorKey: "paymentStatus",
    size: 160,
    minSize: 120,
    maxSize: 200,
    header: ({ column }) => <SortableHeader column={column} label="Payment" />,
    cell: ({ row }) => (
      <CellValue>
        <span className="break-words">
          {row.original.paymentStatus.replaceAll("_", " ")}
        </span>
      </CellValue>
    ),
  },
  {
    accessorKey: "customerEmail",
    size: 240,
    minSize: 160,
    maxSize: 320,
    enableSorting: false,
    header: () => <span className="px-2">Email</span>,
    cell: ({ row }) => (
      <CellValue>
        <span className="block break-words">
          {row.original.customerEmail ?? "No email"}
        </span>
      </CellValue>
    ),
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
];

const allColumnIds = columns
  .map((column) => getColumnId(column))
  .filter((columnId): columnId is string => columnId !== null);

const columnSizingMeta = Object.fromEntries(
  columns
    .map((column) => {
      const columnId = getColumnId(column);

      if (!columnId) {
        return null;
      }

      return [
        columnId,
        {
          size: column.size ?? 150,
          minSize: column.minSize ?? 20,
          maxSize: column.maxSize ?? Number.POSITIVE_INFINITY,
        },
      ] as const;
    })
    .filter(
      (
        entry,
      ): entry is readonly [
        string,
        { size: number; minSize: number; maxSize: number },
      ] => entry !== null,
    ),
);

const clampColumnWidth = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getVisibleColumnIds = (
  columnOrder: ColumnOrderState,
  columnVisibility: VisibilityState,
) => {
  const orderedColumnIds = [
    ...columnOrder.filter((columnId) => allColumnIds.includes(columnId)),
    ...allColumnIds.filter((columnId) => !columnOrder.includes(columnId)),
  ];

  return orderedColumnIds.filter(
    (columnId) => columnVisibility[columnId] !== false,
  );
};

const getMinimumTableWidth = (visibleColumnIds: string[]) =>
  visibleColumnIds.reduce((totalWidth, columnId) => {
    return totalWidth + (columnSizingMeta[columnId]?.minSize ?? 20);
  }, 0);

const columnSizingStatesMatch = (
  left: ColumnSizingState,
  right: ColumnSizingState,
) => {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of keys) {
    if (Math.abs((left[key] ?? 0) - (right[key] ?? 0)) > 0.5) {
      return false;
    }
  }

  return true;
};

const normalizeColumnSizing = (
  sizing: ColumnSizingState,
  visibleColumnIds: string[],
  targetWidth: number,
) => {
  if (visibleColumnIds.length === 0 || targetWidth <= 0) {
    return sizing;
  }

  const widths = visibleColumnIds.map((columnId) => {
    const meta = columnSizingMeta[columnId] ?? {
      size: 150,
      minSize: 20,
      maxSize: Number.POSITIVE_INFINITY,
    };

    return {
      id: columnId,
      size: clampColumnWidth(
        sizing[columnId] ?? meta.size,
        meta.minSize,
        meta.maxSize,
      ),
      minSize: meta.minSize,
      maxSize: meta.maxSize,
    };
  });

  const totalWidth = widths.reduce((sum, column) => sum + column.size, 0);

  if (totalWidth > targetWidth) {
    let overflow = totalWidth - targetWidth;
    let shrinkableColumns = widths.filter(
      (column) => column.size > column.minSize,
    );

    while (overflow > 0.5 && shrinkableColumns.length > 0) {
      const totalShrinkableWidth = shrinkableColumns.reduce(
        (sum, column) => sum + (column.size - column.minSize),
        0,
      );

      if (totalShrinkableWidth <= 0) {
        break;
      }

      let consumedWidth = 0;

      for (const column of shrinkableColumns) {
        const availableShrink = column.size - column.minSize;
        const shrinkAmount = Math.min(
          availableShrink,
          overflow * (availableShrink / totalShrinkableWidth),
        );

        column.size -= shrinkAmount;
        consumedWidth += shrinkAmount;
      }

      if (consumedWidth <= 0) {
        break;
      }

      overflow -= consumedWidth;
      shrinkableColumns = widths.filter(
        (column) => column.size > column.minSize,
      );
    }
  } else if (totalWidth < targetWidth) {
    let remainingWidth = targetWidth - totalWidth;
    const serviceColumn = widths.find((column) => column.id === "name");

    if (serviceColumn && serviceColumn.size < serviceColumn.maxSize) {
      const growth = Math.min(
        remainingWidth,
        serviceColumn.maxSize - serviceColumn.size,
      );
      serviceColumn.size += growth;
      remainingWidth -= growth;
    }

    let growableColumns = widths.filter(
      (column) => column.size < column.maxSize,
    );

    while (remainingWidth > 0.5 && growableColumns.length > 0) {
      const totalGrowableWidth = growableColumns.reduce(
        (sum, column) => sum + (column.maxSize - column.size),
        0,
      );

      if (totalGrowableWidth <= 0) {
        break;
      }

      let addedWidth = 0;

      for (const column of growableColumns) {
        const availableGrowth = column.maxSize - column.size;
        const growthAmount = Math.min(
          availableGrowth,
          remainingWidth * (availableGrowth / totalGrowableWidth),
        );

        column.size += growthAmount;
        addedWidth += growthAmount;
      }

      if (addedWidth <= 0) {
        break;
      }

      remainingWidth -= addedWidth;
      growableColumns = widths.filter((column) => column.size < column.maxSize);
    }
  }

  return widths.reduce<ColumnSizingState>(
    (nextSizing, column) => {
      nextSizing[column.id] = column.size;
      return nextSizing;
    },
    { ...sizing },
  );
};

export function OrdersTable({
  orders,
  ordersAvailable,
}: {
  orders: OrderListItem[];
  ordersAvailable: boolean;
}) {
  const tableViewportRef = React.useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { startRouteTransition } = useRouteTransition();
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
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<"status" | "service">(
    "status",
  );

  const visibleColumnIds = React.useMemo(
    () => getVisibleColumnIds(columnOrder, columnVisibility),
    [columnOrder, columnVisibility],
  );
  const minimumTableWidth = React.useMemo(
    () => getMinimumTableWidth(visibleColumnIds),
    [visibleColumnIds],
  );
  const targetTableWidth = React.useMemo(
    () => Math.max(containerWidth, minimumTableWidth),
    [containerWidth, minimumTableWidth],
  );

  React.useEffect(() => {
    const node = tableViewportRef.current;

    if (!node) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(node.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (targetTableWidth <= 0) {
      return;
    }

    setColumnSizing((currentSizing) => {
      const nextSizing = normalizeColumnSizing(
        currentSizing,
        visibleColumnIds,
        targetTableWidth,
      );

      return columnSizingStatesMatch(currentSizing, nextSizing)
        ? currentSizing
        : nextSizing;
    });
  }, [targetTableWidth, visibleColumnIds]);

  const table = useReactTable({
    data: orders,
    columns,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onColumnSizingChange: (updater) => {
      setColumnSizing((currentSizing) => {
        const nextSizing =
          typeof updater === "function" ? updater(currentSizing) : updater;

        return normalizeColumnSizing(
          nextSizing,
          visibleColumnIds,
          targetTableWidth,
        );
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      pagination,
      columnSizing,
    },
  });

  const invisibleColumns = React.useRef<string[]>(["recent", "serviceType"]);

  const serviceTypes = React.useMemo(
    () =>
      [...new Set(orders.map((order) => getServiceType(order)))].sort((a, b) =>
        serviceTypeLabels[a].localeCompare(serviceTypeLabels[b]),
      ),
    [orders],
  );

  const visibleColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanHide() && !invisibleColumns.current.includes(column.id),
    );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Booked Services</CardTitle>
        <CardDescription>
          Review your mixing and mastering orders, including service, status,
          order date, and total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!ordersAvailable && (
          <Alert className="mb-4 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
            <AlertCircle className="!h-4 !w-4" />
            <AlertTitle>Order history schema not applied</AlertTitle>
            <AlertDescription>
              This database currently supports carts and pricing tables, but not
              the new <code>orders</code> / <code>order_items</code> tables yet.
              Apply the order-history migrations, including{" "}
              <code>0021_add_orders_account_history</code> and{" "}
              <code>0023_add_order_workflow_status</code>, to enable persisted
              purchases and studio workflow statuses on this page.
            </AlertDescription>
          </Alert>
        )}

        <div className="w-full">
          <div className="flex items-center gap-x-8 py-4">
            <Input
              placeholder="Filter session names..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-md justify-self-start"
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
                className="h-[320px] w-[272px] px-0 py-0"
              >
                <Tabs
                  className="w-full"
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "status" | "service")
                  }
                >
                  <TabsList className="h-full w-full rounded-none p-0">
                    <TabsTrigger value="status" className="w-1/2 rounded-none">
                      Status
                    </TabsTrigger>
                    <TabsTrigger value="service" className="w-1/2 rounded-none">
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
                        className={
                          (table.getColumn("status")?.getFilterValue() ??
                            "") === "" &&
                          table.getColumn("recent")?.getFilterValue() ===
                            undefined
                            ? "text-cyan-500"
                            : ""
                        }
                        checked={
                          (table.getColumn("status")?.getFilterValue() ??
                            "") === "" &&
                          table.getColumn("recent")?.getFilterValue() ===
                            undefined
                        }
                        onCheckedChange={() => resetFilters(table)}
                      >
                        <Button className="p-0">All</Button>
                      </DropdownMenuCheckboxItem>
                      <Separator />
                      {Object.entries(workflowStatusLabels).map(
                        ([status, label]) => (
                          <DropdownMenuCheckboxItem
                            side="right"
                            key={status}
                            className={
                              (table.getColumn("status")?.getFilterValue() ??
                                "") === status
                                ? "text-cyan-500"
                                : ""
                            }
                            checked={
                              (table.getColumn("status")?.getFilterValue() ??
                                "") === status
                            }
                            onCheckedChange={() => {
                              const selectedStatus =
                                table.getColumn("status")?.getFilterValue() ??
                                "";

                              resetFilters(table);
                              table
                                .getColumn("status")
                                ?.setFilterValue(
                                  selectedStatus === status ? "" : status,
                                );
                            }}
                          >
                            <Button className="p-0">{label}</Button>
                          </DropdownMenuCheckboxItem>
                        ),
                      )}
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent
                    value="service"
                    className="mt-0 h-[290px] w-full"
                  >
                    <ScrollArea className="h-full w-full px-4">
                      <DropdownMenuCheckboxItem
                        side="right"
                        className={
                          (table.getColumn("serviceType")?.getFilterValue() ??
                            "") === ""
                            ? "text-cyan-500"
                            : ""
                        }
                        checked={
                          (table.getColumn("serviceType")?.getFilterValue() ??
                            "") === ""
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
                          className={
                            (table.getColumn("serviceType")?.getFilterValue() ??
                              "") === serviceType
                              ? "text-cyan-500"
                              : ""
                          }
                          checked={
                            (table.getColumn("serviceType")?.getFilterValue() ??
                              "") === serviceType
                          }
                          onCheckedChange={() => {
                            const selectedServiceType =
                              table
                                .getColumn("serviceType")
                                ?.getFilterValue() ?? "";

                            resetFilters(table);
                            table
                              .getColumn("serviceType")
                              ?.setFilterValue(
                                selectedServiceType === serviceType
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
                    {column.id === "checkoutSessionId"
                      ? "reference"
                      : column.id === "orderedAt"
                        ? "date"
                        : column.id === "service"
                          ? "service"
                          : column.id === "name"
                            ? "name"
                          : column.id === "songCount"
                            ? "songs"
                            : column.id === "itemCount"
                              ? "quantity"
                          : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-full">
            <div
              ref={tableViewportRef}
              className="w-full overflow-x-auto rounded-md border"
            >
              <table
                className="caption-bottom text-sm"
                style={{
                  width: targetTableWidth > 0 ? targetTableWidth : "100%",
                  minWidth: "100%",
                }}
              >
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "relative align-top py-3 whitespace-normal [overflow-wrap:anywhere]",
                            getCellAlignment(header.column.id) === "end" &&
                              "text-right",
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
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => {
                          startRouteTransition();
                          router.push(`/account/orders/${row.original.id}`);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            startRouteTransition();
                            router.push(`/account/orders/${row.original.id}`);
                          }
                        }}
                        tabIndex={0}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={getTableCellClassName(cell.column.id)}
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
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        {ordersAvailable
                          ? "No results."
                          : "Order history will appear here after the orders migration is applied."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end py-4">
            <div className="w-1/3">
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
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
      </CardContent>
    </Card>
  );
}
