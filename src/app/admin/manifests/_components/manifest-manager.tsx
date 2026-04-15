"use client";

import * as React from "react";

import { Accordion } from "~/components/ui/accordion";
import { ManifestBuilderSection } from "./manifest-builder-section";
import { type GearManifest, type ManifestGearItem } from "./manifest-manager-types";
import { ManifestQrPreviewDialog } from "./manifest-qr-preview-dialog";
import { ManifestScanSection } from "./manifest-scan-section";
import { SavedManifestsSection } from "./saved-manifests-section";
import { useManifestManager } from "./use-manifest-manager";

export function ManifestManager({
  initialGear,
  initialManifests,
}: {
  initialGear: ManifestGearItem[];
  initialManifests: GearManifest[];
}) {
  const [openSections, setOpenSections] = React.useState<string[]>(["builder"]);
  const [previewDialogOpen, setPreviewDialogOpen] = React.useState(false);
  const state = useManifestManager({
    initialGear,
    initialManifests,
    onManifestCreated: () => {
      setOpenSections((current) =>
        current.includes("saved") ? current : [...current, "saved"],
      );
      setPreviewDialogOpen(true);
    },
  });

  return (
    <>
      <Accordion
        type="multiple"
        value={openSections}
        onValueChange={setOpenSections}
        className="flex min-w-0 flex-col gap-6 px-0"
      >
        <ManifestBuilderSection
          gear={state.gear}
          manifestName={state.manifestForm.name}
          manifestNotes={state.manifestForm.notes}
          setManifestName={(value) =>
            state.setManifestForm((current) => ({ ...current, name: value }))
          }
          setManifestNotes={(value) =>
            state.setManifestForm((current) => ({ ...current, notes: value }))
          }
          selectedIds={state.selectedBuilderIds}
          toggleSelected={state.toggleBuilderSelection}
          clearSelected={state.clearBuilderSelection}
          builderError={state.builderError}
          isSaving={state.createManifestMutation.isPending}
          onCreate={state.handleCreateManifest}
        />

        <SavedManifestsSection
          manifests={state.manifests}
          selectedManifestId={state.selectedManifestId}
          setSelectedManifestId={state.setSelectedManifestId}
          selectedManifest={state.activeManifest}
          selectedManifestQrParts={state.activeManifestQrParts}
          deleteManifestId={state.deleteManifestMutation.variables?.id ?? null}
          onDeleteManifest={state.handleDeleteManifest}
        />

        <ManifestScanSection
          onPayloadDetected={state.scanState.addRawValue}
          onClear={state.scanState.clear}
          manifestName={state.scanState.combined.manifestName}
          partCount={state.scanState.combined.partCount}
          scannedPartCount={state.scanState.combined.scannedPartCount}
          missingPartIndexes={state.scanState.combined.missingPartIndexes}
          scanError={state.scanState.scanError}
          scannedGear={state.scannedManifestGear}
          missingScannedGearIds={state.missingScannedGearIds}
        />
      </Accordion>

      <ManifestQrPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        manifest={state.activeManifest}
        parts={state.activeManifestQrParts}
      />
    </>
  );
}
