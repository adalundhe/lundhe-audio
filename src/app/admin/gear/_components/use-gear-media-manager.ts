"use client";

import * as React from "react";

import { api } from "~/trpc/react";
import type {
  GearItem,
  GearMediaAsset,
  GearMediaUploadInstruction,
} from "./gear-manager-types";
import {
  downloadMultipartFileFromRoute,
  uploadMultipartFileToPresignedUrls,
} from "./gear-media-transfer";

type PendingTransferStatus =
  | "preparing"
  | "uploading"
  | "finalizing"
  | "completed"
  | "error";

export type PendingGearMediaTransfer = {
  byteSize: number;
  fileName: string;
  id: string;
  progressPercent: number;
  status: PendingTransferStatus;
  errorMessage: string | null;
};

const mediaFileInputAccept =
  "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.csv";

export const gearMediaFileInputAccept = mediaFileInputAccept;

export function useGearMediaManager({
  item,
  onAssetCreated,
  onAssetDeleted,
}: {
  item: GearItem;
  onAssetCreated: (itemId: string, asset: GearMediaAsset) => void;
  onAssetDeleted: (itemId: string, assetId: string) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pendingTransfers, setPendingTransfers] = React.useState<
    PendingGearMediaTransfer[]
  >([]);
  const [mediaError, setMediaError] = React.useState<string | null>(null);
  const [downloadingAssetId, setDownloadingAssetId] = React.useState<string | null>(
    null,
  );
  const utils = api.useUtils();

  const prepareMediaUploadMutation = api.adminGear.prepareMediaUpload.useMutation();
  const completeMediaUploadMutation = api.adminGear.completeMediaUpload.useMutation();
  const abortMediaUploadMutation = api.adminGear.abortMediaUpload.useMutation();
  const deleteMediaAssetMutation = api.adminGear.deleteMediaAsset.useMutation();

  const setTransferState = React.useCallback(
    (
      transferId: string,
      updater: (current: PendingGearMediaTransfer) => PendingGearMediaTransfer,
    ) => {
      setPendingTransfers((current) =>
        current.map((transfer) =>
          transfer.id === transferId ? updater(transfer) : transfer,
        ),
      );
    },
    [],
  );

  const removeTransfer = React.useCallback((transferId: string) => {
    setPendingTransfers((current) =>
      current.filter((transfer) => transfer.id !== transferId),
    );
  }, []);

  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const uploadFile = React.useCallback(
    async (file: File) => {
      const transferId = crypto.randomUUID();
      setMediaError(null);
      setPendingTransfers((current) => [
        ...current,
        {
          byteSize: file.size,
          errorMessage: null,
          fileName: file.name,
          id: transferId,
          progressPercent: 0,
          status: "preparing",
        },
      ]);

      let instruction: GearMediaUploadInstruction | null = null;

      try {
        instruction = await prepareMediaUploadMutation.mutateAsync({
          byteSize: file.size,
          contentType: file.type || "application/octet-stream",
          equipmentItemId: item.id,
          fileName: file.name,
        });

        setTransferState(transferId, (current) => ({
          ...current,
          status: "uploading",
        }));

        const completedParts = await uploadMultipartFileToPresignedUrls({
          file,
          instruction,
          onProgress: (loadedBytes) => {
            const progressPercent =
              file.size > 0 ? Math.min(Math.round((loadedBytes / file.size) * 100), 100) : 0;
            setTransferState(transferId, (current) => ({
              ...current,
              progressPercent,
              status: "uploading",
            }));
          },
        });

        setTransferState(transferId, (current) => ({
          ...current,
          progressPercent: 100,
          status: "finalizing",
        }));

        const createdAsset = await completeMediaUploadMutation.mutateAsync({
          byteSize: file.size,
          completedParts,
          contentType: file.type || "application/octet-stream",
          equipmentItemId: item.id,
          fileName: file.name,
          mediaId: instruction.mediaId,
          objectKey: instruction.objectKey,
          uploadId: instruction.uploadId,
        });

        onAssetCreated(item.id, createdAsset);
        await Promise.allSettled([
          utils.adminGear.listMediaAssets.invalidate({
            equipmentItemId: item.id,
          }),
          utils.adminGear.list.invalidate(),
        ]);
        setTransferState(transferId, (current) => ({
          ...current,
          progressPercent: 100,
          status: "completed",
        }));
        window.setTimeout(() => {
          removeTransfer(transferId);
        }, 1000);
      } catch (error) {
        if (instruction) {
          void abortMediaUploadMutation.mutateAsync({
            objectKey: instruction.objectKey,
            uploadId: instruction.uploadId,
          }).catch(() => undefined);
        }

        const message =
          error instanceof Error && error.message.trim() !== ""
            ? error.message
            : "Unable to upload this file right now.";
        setMediaError(message);
        setTransferState(transferId, (current) => ({
          ...current,
          errorMessage: message,
          status: "error",
        }));
      }
    },
    [
      abortMediaUploadMutation,
      completeMediaUploadMutation,
      item.id,
      onAssetCreated,
      prepareMediaUploadMutation,
      removeTransfer,
      setTransferState,
      utils.adminGear.list,
      utils.adminGear.listMediaAssets,
    ],
  );

  const handleFilesSelected = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";

      for (const file of files) {
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleDeleteAsset = React.useCallback(
    async (asset: GearMediaAsset) => {
      setMediaError(null);

      try {
        await deleteMediaAssetMutation.mutateAsync({ id: asset.id });
        onAssetDeleted(item.id, asset.id);
        await Promise.allSettled([
          utils.adminGear.listMediaAssets.invalidate({
            equipmentItemId: item.id,
          }),
          utils.adminGear.list.invalidate(),
        ]);
      } catch (error) {
        setMediaError(
          error instanceof Error && error.message.trim() !== ""
            ? error.message
            : "Unable to delete this file right now.",
        );
      }
    },
    [
      deleteMediaAssetMutation,
      item.id,
      onAssetDeleted,
      utils.adminGear.list,
      utils.adminGear.listMediaAssets,
    ],
  );

  const handleDownloadAsset = React.useCallback(
    async (asset: GearMediaAsset) => {
      setMediaError(null);
      setDownloadingAssetId(asset.id);

      try {
        await downloadMultipartFileFromRoute({
          byteSize: asset.byteSize,
          contentType: asset.contentType || "application/octet-stream",
          fileName: asset.fileName,
          url: `/api/admin/gear/media/${asset.id}`,
        });
      } catch (error) {
        setMediaError(
          error instanceof Error && error.message.trim() !== ""
            ? error.message
            : "Unable to download this file right now.",
        );
      } finally {
        setDownloadingAssetId(null);
      }
    },
    [],
  );

  return {
    deleteMediaAssetMutation,
    downloadingAssetId,
    fileInputRef,
    handleDeleteAsset,
    handleDownloadAsset,
    handleFilesSelected,
    mediaError,
    openFilePicker,
    pendingTransfers,
  };
}
