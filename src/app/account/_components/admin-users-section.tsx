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
import { format } from "date-fns";
import { ArrowUpDown, ChevronDown, Loader2 } from "lucide-react";

import { ColumnResizer } from "~/components/ColumnResizer";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
import type { AdminUserListItem } from "~/server/api/routers/admin-users";
import { api } from "~/trpc/react";
import type { UserRole } from "~/types/roles";

type AdminUsersColumnDef = ColumnDef<AdminUserListItem> & {
  id?: string;
  accessorKey?: string;
};

const ROLE_OPTIONS: UserRole[] = ["admin", "user"];

const defaultColumnVisibility: VisibilityState = {
  search: false,
  recent: false,
  signInState: false,
};

const defaultColumnOrder: ColumnOrderState = [
  "user",
  "email",
  "createdAt",
  "lastSignInAt",
  "role",
  "search",
  "recent",
  "signInState",
];

const invisibleColumns = new Set(["search", "recent", "signInState"]);

const initialsFor = (user: AdminUserListItem) => {
  const first = user.firstName?.[0] ?? "";
  const last = user.lastName?.[0] ?? "";
  const fallback = (user.email ?? "?")[0]?.toUpperCase() ?? "?";
  return (first + last).toUpperCase() || fallback;
};

const getFullName = (user: AdminUserListItem) =>
  [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part))
    .join(" ") || "—";

const formatJoinedDate = (timestamp: number) =>
  format(new Date(timestamp), "yyyy-MM-dd");

const formatLastSignIn = (timestamp: number | null) =>
  timestamp ? format(new Date(timestamp), "yyyy-MM-dd HH:mm") : "—";

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

function RoleBadgeEditor({
  user,
  isPending,
  isSelf,
  onRoleChange,
}: {
  user: AdminUserListItem;
  isPending: boolean;
  isSelf: boolean;
  onRoleChange: (userId: string, value: string) => void;
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
          <Badge
            variant={user.role === "admin" ? "default" : "outline"}
            className={cn(isPending && "opacity-60")}
          >
            {user.role}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 p-2"
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
              Update Role
            </p>
            {isSelf && user.role === "admin" ? (
              <p className="text-xs text-muted-foreground">
                Another admin must demote you.
              </p>
            ) : null}
          </div>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : null}
        </div>
        <div className="grid gap-1">
          {ROLE_OPTIONS.map((role) => (
            <Button
              key={role}
              type="button"
              variant="ghost"
              className={cn(
                "h-auto justify-start px-2 py-2 text-left",
                user.role === role && "text-cyan-500",
              )}
              disabled={isPending || (isSelf && user.role === "admin" && role !== "admin")}
              onClick={() => {
                onRoleChange(user.id, role);
                setOpen(false);
              }}
            >
              {role}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const resetFilters = (table: ReturnType<typeof useReactTable<AdminUserListItem>>) => {
  if (table.getColumn("recent")?.getFilterValue() !== undefined) {
    table.getColumn("recent")?.setFilterValue(undefined);
  }

  for (const columnId of ["role", "signInState"] as const) {
    if ((table.getColumn(columnId)?.getFilterValue() ?? "") !== "") {
      table.getColumn(columnId)?.setFilterValue("");
    }
  }
};

const columnLabels: Record<string, string> = {
  user: "user",
  email: "email",
  createdAt: "joined",
  lastSignInAt: "last sign in",
  role: "role",
};

export function AdminUsersSection({
  initialUsers,
  totalCount,
  currentUserId,
}: {
  initialUsers: AdminUserListItem[];
  totalCount: number;
  currentUserId: string | null;
}) {
  const [users, setUsers] = React.useState<AdminUserListItem[]>(initialUsers);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "createdAt",
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
  const [activeTab, setActiveTab] = React.useState<"role" | "activity">(
    "role",
  );

  const setRoleMutation = api.adminUsers.setRole.useMutation({
    onMutate: ({ userId }) => {
      setError(null);
      setPendingId(userId);
    },
    onSuccess: ({ id, role }) => {
      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, role } : user)),
      );
    },
    onError: (err) => {
      setError(err.message);
    },
    onSettled: () => {
      setPendingId(null);
    },
  });

  const handleRoleChange = React.useCallback(
    (userId: string, value: string) => {
      if (!ROLE_OPTIONS.includes(value as UserRole)) {
        return;
      }

      setRoleMutation.mutate({
        userId,
        role: value as UserRole,
      });
    },
    [setRoleMutation],
  );

  const columns = React.useMemo<AdminUsersColumnDef[]>(
    () => [
      {
        id: "user",
        accessorFn: (row) => getFullName(row),
        size: 240,
        minSize: 180,
        maxSize: 340,
        header: ({ column }) => <SortableHeader column={column} label="User" />,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUserId;

          return (
            <div className="flex min-h-12 items-center gap-3 py-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.imageUrl} alt={getFullName(user)} />
                <AvatarFallback>{initialsFor(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{getFullName(user)}</p>
                {isSelf ? (
                  <p className="text-xs text-muted-foreground">(you)</p>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        size: 280,
        minSize: 220,
        maxSize: 420,
        header: ({ column }) => <SortableHeader column={column} label="Email" />,
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-sm">
            {row.original.email ?? (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        ),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.createdAt,
        size: 150,
        minSize: 120,
        maxSize: 190,
        header: ({ column }) => (
          <SortableHeader column={column} label="Joined" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-sm">
            {formatJoinedDate(row.original.createdAt)}
          </div>
        ),
      },
      {
        id: "lastSignInAt",
        accessorFn: (row) => row.lastSignInAt ?? -1,
        size: 190,
        minSize: 160,
        maxSize: 240,
        header: ({ column }) => (
          <SortableHeader column={column} label="Last Sign In" />
        ),
        cell: ({ row }) => (
          <div className="min-h-12 py-1 text-sm">
            {formatLastSignIn(row.original.lastSignInAt)}
          </div>
        ),
      },
      {
        accessorKey: "role",
        filterFn: "equalsString",
        size: 130,
        minSize: 110,
        maxSize: 170,
        header: ({ column }) => <SortableHeader column={column} label="Role" />,
        cell: ({ row }) => (
          <div className="min-h-12 py-1">
            <RoleBadgeEditor
              user={row.original}
              isPending={pendingId === row.original.id}
              isSelf={row.original.id === currentUserId}
              onRoleChange={handleRoleChange}
            />
          </div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [getFullName(row), row.email ?? "", row.id].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
      {
        id: "recent",
        accessorFn: (row) => row.createdAt,
        filterFn: (row, _, filterValue: Date) => {
          const createdAt = new Date(row.getValue("recent") as number);
          const deltaMilliseconds = Math.abs(
            filterValue.getTime() - createdAt.getTime(),
          );

          return Math.floor(deltaMilliseconds / (1000 * 60 * 60 * 24)) < 30;
        },
        enableHiding: true,
      },
      {
        id: "signInState",
        accessorFn: (row) => (row.lastSignInAt ? "signed-in" : "never"),
        filterFn: "equalsString",
        enableHiding: true,
      },
    ],
    [currentUserId, handleRoleChange, pendingId],
  );

  const table = useReactTable({
    data: users,
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
        <CardTitle>Admin · Users</CardTitle>
        <CardDescription>
          {totalCount} total. Hover a role badge to promote or demote a user.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col">
        {error ? (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-4 py-4">
              <Input
                placeholder="Search users by name or email..."
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
                  className="h-[300px] w-[280px] px-0 py-0"
                >
                  <Tabs
                    className="w-full"
                    value={activeTab}
                    onValueChange={(value) =>
                      setActiveTab(value as "role" | "activity")
                    }
                  >
                    <TabsList className="h-full w-full rounded-none p-0">
                      <TabsTrigger value="role" className="w-1/2 rounded-none">
                        Role
                      </TabsTrigger>
                      <TabsTrigger
                        value="activity"
                        className="w-1/2 rounded-none"
                      >
                        Activity
                      </TabsTrigger>
                    </TabsList>
                    <Separator className="w-full" />

                    <TabsContent value="role" className="mt-0 h-[270px] w-full">
                      <ScrollArea className="h-full w-full px-4">
                        <DropdownMenuCheckboxItem
                          side="right"
                          checked={
                            (table.getColumn("role")?.getFilterValue() ?? "") ===
                            ""
                          }
                          className={
                            (table.getColumn("role")?.getFilterValue() ?? "") ===
                            ""
                              ? "text-cyan-500"
                              : ""
                          }
                          onCheckedChange={() => resetFilters(table)}
                        >
                          <Button className="p-0">All</Button>
                        </DropdownMenuCheckboxItem>
                        <Separator />
                        {ROLE_OPTIONS.map((role) => (
                          <DropdownMenuCheckboxItem
                            side="right"
                            key={role}
                            checked={
                              (table.getColumn("role")?.getFilterValue() ?? "") ===
                              role
                            }
                            className={
                              (table.getColumn("role")?.getFilterValue() ?? "") ===
                              role
                                ? "text-cyan-500"
                                : ""
                            }
                            onCheckedChange={() => {
                              const selectedRole =
                                table.getColumn("role")?.getFilterValue() ?? "";

                              resetFilters(table);
                              table
                                .getColumn("role")
                                ?.setFilterValue(selectedRole === role ? "" : role);
                            }}
                          >
                            <Button className="p-0">{role}</Button>
                          </DropdownMenuCheckboxItem>
                        ))}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent
                      value="activity"
                      className="mt-0 h-[270px] w-full"
                    >
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
                            (table.getColumn("signInState")?.getFilterValue() ??
                              "") === "" &&
                            table.getColumn("recent")?.getFilterValue() ===
                              undefined
                          }
                          className={
                            (table.getColumn("signInState")?.getFilterValue() ??
                              "") === "" &&
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
                        <DropdownMenuCheckboxItem
                          side="right"
                          checked={
                            (table.getColumn("signInState")?.getFilterValue() ??
                              "") === "signed-in"
                          }
                          className={
                            (table.getColumn("signInState")?.getFilterValue() ??
                              "") === "signed-in"
                              ? "text-cyan-500"
                              : ""
                          }
                          onCheckedChange={() => {
                            const selectedState =
                              table.getColumn("signInState")?.getFilterValue() ??
                              "";

                            resetFilters(table);
                            table
                              .getColumn("signInState")
                              ?.setFilterValue(
                                selectedState === "signed-in"
                                  ? ""
                                  : "signed-in",
                              );
                          }}
                        >
                          <Button className="p-0">Signed In</Button>
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                          side="right"
                          checked={
                            (table.getColumn("signInState")?.getFilterValue() ??
                              "") === "never"
                          }
                          className={
                            (table.getColumn("signInState")?.getFilterValue() ??
                              "") === "never"
                              ? "text-cyan-500"
                              : ""
                          }
                          onCheckedChange={() => {
                            const selectedState =
                              table.getColumn("signInState")?.getFilterValue() ??
                              "";

                            resetFilters(table);
                            table
                              .getColumn("signInState")
                              ?.setFilterValue(
                                selectedState === "never" ? "" : "never",
                              );
                          }}
                        >
                          <Button className="p-0">Never Signed In</Button>
                        </DropdownMenuCheckboxItem>
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
                    const user = row.original;

                    return (
                      <div
                        key={user.id}
                        className="rounded-lg border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imageUrl} alt={getFullName(user)} />
                            <AvatarFallback>{initialsFor(user)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium">
                                {getFullName(user)}
                              </p>
                              {user.id === currentUserId ? (
                                <span className="text-xs text-muted-foreground">
                                  (you)
                                </span>
                              ) : null}
                            </div>
                            <p className="truncate text-sm text-muted-foreground">
                              {user.email ?? "—"}
                            </p>
                          </div>
                          <RoleBadgeEditor
                            user={user}
                            isPending={pendingId === user.id}
                            isSelf={user.id === currentUserId}
                            onRoleChange={handleRoleChange}
                          />
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Joined
                            </p>
                            <p className="text-sm">{formatJoinedDate(user.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Last Sign In
                            </p>
                            <p className="text-sm">
                              {formatLastSignIn(user.lastSignInAt)}
                            </p>
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
                              className="relative align-top py-3 whitespace-nowrap after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-muted last:after:hidden"
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
                                className="align-top py-4 whitespace-nowrap"
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
