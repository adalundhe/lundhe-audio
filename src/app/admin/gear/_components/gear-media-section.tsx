"use client";

import * as React from "react";
import {
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import { Progress } from "~/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { GearItem } from "./gear-manager-types";
import {
  gearMediaFileInputAccept,
  useGearMediaManager,
} from "./use-gear-media-manager";

const formatByteSize = (value: number) => {
  if (value >= 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${value} B`;
};

export const GearMediaSection = React.memo(function GearMediaSection({
  item,
  onAssetCreated,
  onAssetDeleted,
}: {
  item: GearItem;
  onAssetCreated: (itemId: string, asset: GearItem["mediaAssets"][number]) => void;
  onAssetDeleted: (itemId: string, assetId: string) => void;
}) {
  const canUpload = item.created_timestamp.trim() !== "";
  const [selectedAssetId, setSelectedAssetId] = React.useState<string | null>(null);
  const [hoveredAssetId, setHoveredAssetId] = React.useState<string | null>(null);
  const mediaAssetsQuery = api.adminGear.listMediaAssets.useQuery(
    { equipmentItemId: item.id },
    {
      enabled: canUpload,
      refetchOnMount: "always",
      staleTime: 0,
    },
  );
  const {
    deleteMediaAssetMutation,
    downloadingAssetId,
    fileInputRef,
    handleDeleteAsset,
    handleDownloadAsset,
    handleFilesSelected,
    mediaError,
    openFilePicker,
    pendingTransfers,
  } = useGearMediaManager({
    item,
    onAssetCreated,
    onAssetDeleted,
  });
  const mediaAssets = mediaAssetsQuery.data ?? item.mediaAssets;
  const effectiveMediaError =
    mediaError ??
    (mediaAssetsQuery.error instanceof Error && mediaAssets.length === 0
      ? mediaAssetsQuery.error.message
      : null);

  React.useEffect(() => {
    if (!selectedAssetId) {
      return;
    }

    if (!mediaAssets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(null);
    }
  }, [mediaAssets, selectedAssetId]);

  React.useEffect(() => {
    if (!hoveredAssetId) {
      return;
    }

    if (!mediaAssets.some((asset) => asset.id === hoveredAssetId)) {
      setHoveredAssetId(null);
    }
  }, [hoveredAssetId, mediaAssets]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">Photos / Documents</div>
        <div className="text-xs text-muted-foreground">
          Upload receipts, manuals, service invoices, serial-number photos, or
          front/back shots. Transfers use multipart chunked upload/download.
        </div>
      </div>

      {!canUpload ? (
        <div className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
          Save this gear item first, then attach photos or documents directly in
          this row.
        </div>
      ) : (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={gearMediaFileInputAccept}
          className="hidden"
          onChange={(event) => {
            void handleFilesSelected(event);
          }}
        />
      )}

      {effectiveMediaError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {effectiveMediaError}
        </div>
      ) : null}

      {pendingTransfers.length > 0 ? (
        <div className="space-y-2">
          {pendingTransfers.map((transfer) => (
            <div
              key={transfer.id}
              className="rounded-md border border-border/60 px-3 py-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 truncate font-medium">{transfer.fileName}</div>
                <div
                  className={cn(
                    "shrink-0 text-xs uppercase tracking-wide text-muted-foreground",
                    transfer.status === "error" && "text-destructive",
                  )}
                >
                  {transfer.status}
                </div>
              </div>
              <Progress value={transfer.progressPercent} />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{formatByteSize(transfer.byteSize)}</span>
                <span>{transfer.progressPercent}%</span>
              </div>
              {transfer.errorMessage ? (
                <div className="mt-2 text-xs text-destructive">
                  {transfer.errorMessage}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-md border border-border/70">
        <Table className="w-max min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Type</TableHead>
              <TableHead className="whitespace-nowrap">File</TableHead>
              <TableHead className="whitespace-nowrap">Content Type</TableHead>
              <TableHead className="whitespace-nowrap text-right">Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaAssetsQuery.isLoading && mediaAssets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  Loading attached files...
                </TableCell>
              </TableRow>
            ) : mediaAssets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No photos or documents attached yet.
                </TableCell>
              </TableRow>
            ) : (
              mediaAssets.map((asset) => (
                <HoverCard
                  key={asset.id}
                  open={selectedAssetId === asset.id || hoveredAssetId === asset.id}
                  openDelay={75}
                  closeDelay={75}
                  onOpenChange={(open) => {
                    setHoveredAssetId((current) => {
                      if (open) {
                        return asset.id;
                      }

                      return current === asset.id ? null : current;
                    });
                  }}
                >
                  <TableRow
                    className={cn(
                      "cursor-pointer",
                      selectedAssetId === asset.id && "bg-muted",
                    )}
                    onClick={() =>
                      setSelectedAssetId((current) =>
                        current === asset.id ? null : asset.id,
                      )
                    }
                  >
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className="gap-1">
                        {asset.assetType === "photo" ? (
                          <ImageIcon className="!h-[16px] !w-[16px]" />
                        ) : (
                          <FileText className="!h-[16px] !w-[16px]" />
                        )}
                        {asset.assetType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[24rem] whitespace-nowrap">
                      <HoverCardTrigger asChild>
                        <div className="truncate text-sm font-medium">
                          {asset.fileName}
                        </div>
                      </HoverCardTrigger>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {asset.contentType}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm">
                      {formatByteSize(asset.byteSize)}
                    </TableCell>
                  </TableRow>
                  <HoverCardContent
                    side="top"
                    align="end"
                    sideOffset={10}
                    className="z-[80] w-auto p-2"
                  >
                    <div className="inline-flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border border-black hover:border-green-500 hover:bg-green-50 hover:text-green-500 dark:border-white dark:hover:bg-green-950/30"
                        disabled={downloadingAssetId === asset.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDownloadAsset(asset);
                        }}
                        aria-label={`Download ${asset.fileName}`}
                      >
                        {downloadingAssetId === asset.id ? (
                          <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                        ) : (
                          <Download className="mr-2 !h-[16px] !w-[16px]" />
                        )}
                        Download
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="border border-red-600 text-red-600 hover:bg-red-600/30"
                        disabled={deleteMediaAssetMutation.isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteAsset(asset);
                        }}
                        aria-label={`Delete ${asset.fileName}`}
                      >
                        <Trash2 className="mr-2 !h-[16px] !w-[16px]" />
                        Delete
                      </Button>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canUpload ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={openFilePicker}
            className="border border-black hover:border-green-500 hover:bg-green-50 hover:text-green-500 dark:border-white dark:hover:bg-green-950/30"
          >
            <Plus className="mr-2 !h-[16px] !w-[16px]" />
            Add Files
          </Button>
        </div>
      ) : null}
    </div>
  );
});
