"use client";

import * as React from "react";

import { buildGearManifestQrParts } from "~/lib/gear-manifests/qr";
import { api } from "~/trpc/react";
import {
  type GearManifest,
  type ManifestGearItem,
} from "./manifest-manager-types";
import { useManifestScan } from "./use-manifest-scan";

interface ManifestFormState {
  name: string;
  notes: string;
}

const emptyManifestForm: ManifestFormState = {
  name: "",
  notes: "",
};

export function useManifestManager({
  initialGear,
  initialManifests,
  onManifestCreated,
}: {
  initialGear: ManifestGearItem[];
  initialManifests: GearManifest[];
  onManifestCreated?: (manifestId: string) => void;
}) {
  const utils = api.useUtils();
  const scanState = useManifestScan();
  const [gear] = React.useState(initialGear);
  const [manifests, setManifests] = React.useState(initialManifests);
  const [manifestForm, setManifestForm] =
    React.useState<ManifestFormState>(emptyManifestForm);
  const [selectedBuilderIds, setSelectedBuilderIds] = React.useState<string[]>([]);
  const [selectedManifestId, setSelectedManifestId] = React.useState<string | null>(
    initialManifests[0]?.id ?? null,
  );
  const [builderError, setBuilderError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setManifests(initialManifests);
    setSelectedManifestId((current) =>
      current && initialManifests.some((manifest) => manifest.id === current)
        ? current
        : initialManifests[0]?.id ?? null,
    );
  }, [initialManifests]);

  const createManifestMutation = api.adminManifests.create.useMutation({
    onSuccess: async (createdManifest) => {
      setManifests((current) => [createdManifest, ...current]);
      setSelectedManifestId(createdManifest.id);
      setSelectedBuilderIds([]);
      setManifestForm(emptyManifestForm);
      setBuilderError(null);
      onManifestCreated?.(createdManifest.id);
      await utils.adminManifests.list.invalidate();
    },
    onError: (error) => {
      setBuilderError(error.message);
    },
  });

  const deleteManifestMutation = api.adminManifests.delete.useMutation({
    onSuccess: async ({ id }) => {
      setManifests((current) => current.filter((manifest) => manifest.id !== id));
      setSelectedManifestId((current) => (current === id ? null : current));
      await utils.adminManifests.list.invalidate();
    },
  });

  const selectedBuilderIdSet = React.useMemo(
    () => new Set(selectedBuilderIds),
    [selectedBuilderIds],
  );

  const selectedBuilderItems = React.useMemo(
    () => gear.filter((item) => selectedBuilderIdSet.has(item.id)),
    [gear, selectedBuilderIdSet],
  );

  const activeManifest = React.useMemo(
    () =>
      selectedManifestId
        ? manifests.find((manifest) => manifest.id === selectedManifestId) ?? null
        : null,
    [manifests, selectedManifestId],
  );

  const activeManifestQrParts = React.useMemo(
    () =>
      activeManifest
        ? buildGearManifestQrParts({
            manifestId: activeManifest.id,
            manifestName: activeManifest.name,
            entries: activeManifest.entries.map((entry) => ({
              i: entry.equipmentItemId,
              n: entry.itemName,
              m: entry.manufacturer,
              t: entry.type,
              g: entry.group,
              q: entry.quantity,
            })),
          })
        : [],
    [activeManifest],
  );

  const scannedManifestGearIds = React.useMemo(
    () => scanState.combined.entries.map((entry) => entry.i),
    [scanState.combined.entries],
  );

  const scannedManifestGear = React.useMemo(() => {
    const gearById = new Map(gear.map((item) => [item.id, item]));

    return scannedManifestGearIds
      .map((itemId) => gearById.get(itemId))
      .filter((item): item is ManifestGearItem => Boolean(item));
  }, [gear, scannedManifestGearIds]);

  const missingScannedGearIds = React.useMemo(() => {
    const gearIdSet = new Set(gear.map((item) => item.id));
    return scannedManifestGearIds.filter((itemId) => !gearIdSet.has(itemId));
  }, [gear, scannedManifestGearIds]);

  const toggleBuilderSelection = React.useCallback((id: string, next: boolean) => {
    setSelectedBuilderIds((current) => {
      const nextIds = new Set(current);

      if (next) {
        nextIds.add(id);
      } else {
        nextIds.delete(id);
      }

      return [...nextIds];
    });
  }, []);

  const clearBuilderSelection = React.useCallback(() => {
    setSelectedBuilderIds([]);
  }, []);

  const handleCreateManifest = React.useCallback(() => {
    const normalizedName = manifestForm.name.trim();

    if (!normalizedName) {
      setBuilderError("Manifest name is required.");
      return;
    }

    if (selectedBuilderIds.length === 0) {
      setBuilderError("Select at least one gear item.");
      return;
    }

    createManifestMutation.mutate({
      name: normalizedName,
      notes: manifestForm.notes.trim(),
      equipmentItemIds: selectedBuilderIds,
    });
  }, [
    createManifestMutation,
    manifestForm.name,
    manifestForm.notes,
    selectedBuilderIds,
  ]);

  const handleDeleteManifest = React.useCallback(
    (manifestId: string) => {
      deleteManifestMutation.mutate({ id: manifestId });
    },
    [deleteManifestMutation],
  );

  return {
    gear,
    manifests,
    manifestForm,
    setManifestForm,
    builderError,
    setBuilderError,
    selectedBuilderIds,
    selectedBuilderItems,
    selectedBuilderCount: selectedBuilderIds.length,
    toggleBuilderSelection,
    clearBuilderSelection,
    createManifestMutation,
    handleCreateManifest,
    deleteManifestMutation,
    handleDeleteManifest,
    selectedManifestId,
    setSelectedManifestId,
    activeManifest,
    activeManifestQrParts,
    scanState,
    scannedManifestGear,
    missingScannedGearIds,
  };
}
