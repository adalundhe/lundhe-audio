"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import {
  AdminDataTable,
  type AdminDataTableColumnDef,
  SortableHeader,
} from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import { SectionAccordionCard } from "~/app/admin/gear/_components/section-accordion-card";
import { type GearManifest } from "./manifest-manager-types";
import { ManifestQrPreviewSection } from "./manifest-qr-preview-section";
import { type GearManifestQrPart } from "~/lib/gear-manifests/qr";

export function SavedManifestsSection({
  manifests,
  selectedManifestId,
  setSelectedManifestId,
  selectedManifest,
  selectedManifestQrParts,
  deleteManifestId,
  onDeleteManifest,
}: {
  manifests: GearManifest[];
  selectedManifestId: string | null;
  setSelectedManifestId: (id: string | null) => void;
  selectedManifest: GearManifest | null;
  selectedManifestQrParts: GearManifestQrPart[];
  deleteManifestId: string | null;
  onDeleteManifest: (id: string) => void;
}) {
  const columns = React.useMemo<AdminDataTableColumnDef<GearManifest>[]>(
    () => [
      {
        accessorKey: "name",
        size: 260,
        minSize: 200,
        maxSize: 420,
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="truncate text-sm font-medium">{row.original.name}</div>
        ),
      },
      {
        id: "entryCount",
        accessorFn: (row) => row.entries.length,
        size: 120,
        minSize: 90,
        maxSize: 160,
        header: ({ column }) => <SortableHeader column={column} label="Items" align="end" />,
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.entries.length}</div>
        ),
      },
      {
        accessorKey: "partCount",
        size: 120,
        minSize: 90,
        maxSize: 160,
        header: ({ column }) => <SortableHeader column={column} label="QR Parts" align="end" />,
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.partCount}</div>
        ),
      },
      {
        accessorKey: "created_timestamp",
        size: 220,
        minSize: 170,
        maxSize: 280,
        header: ({ column }) => <SortableHeader column={column} label="Created" />,
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.created_timestamp}
          </div>
        ),
      },
      {
        accessorKey: "notes",
        size: 360,
        minSize: 220,
        maxSize: 520,
        enableSorting: false,
        header: () => (
          <div className="flex h-full w-full items-center text-left text-muted-foreground">
            Notes
          </div>
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.notes || "—"}
          </div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [row.name, row.notes, String(row.partCount), String(row.entries.length)].join(
            " ",
          ),
        filterFn: "includesString",
        enableHiding: true,
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        size: 70,
        minSize: 70,
        maxSize: 70,
        header: () => <div className="w-fit" />,
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete manifest "${row.original.name}"? This cannot be undone.`,
                  )
                ) {
                  onDeleteManifest(row.original.id);
                }
              }}
              aria-label={`Delete ${row.original.name}`}
            >
              {deleteManifestId === row.original.id ? (
                <Loader2 className="!h-[16px] !w-[16px] animate-spin" />
              ) : (
                <Trash2 className="!h-[16px] !w-[16px] text-destructive" />
              )}
            </Button>
          </div>
        ),
      },
    ],
    [deleteManifestId, onDeleteManifest],
  );

  return (
    <SectionAccordionCard
      value="saved"
      title="Saved Manifests"
      description="Persisted manifests can be reopened, printed again, or deleted."
      contentClassName="min-w-0 px-0"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <AdminDataTable
          data={manifests}
          columns={columns}
          searchColumnId="search"
          searchPlaceholder="Search manifests..."
          emptyMessage="No manifests yet."
          initialSorting={[{ id: "created_timestamp", desc: true }]}
          initialColumnVisibility={{ search: false }}
          initialColumnOrder={[
            "name",
            "entryCount",
            "partCount",
            "created_timestamp",
            "notes",
            "search",
            "actions",
          ]}
          invisibleColumns={["search"]}
          columnLabels={{
            name: "name",
            created_timestamp: "created",
            notes: "notes",
            partCount: "qr parts",
            entryCount: "items",
          }}
          getRowClassName={(row) =>
            selectedManifestId === row.original.id ? "bg-muted" : undefined
          }
          onRowClick={(row) =>
            setSelectedManifestId(row.id === selectedManifestId ? null : row.id)
          }
        />

        <ManifestQrPreviewSection
          manifest={selectedManifest}
          parts={selectedManifestQrParts}
        />
      </div>
    </SectionAccordionCard>
  );
}
