"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  FileAudio,
  Lock,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  completePreparedOrderUpload,
  prepareOrderUploadSubmission,
  type PreparedOrderUpload,
  type PreparedOrderUploadInput,
} from "~/actions/orders/uploads";
import {
  prepareOrderArchiveDownloads,
  type PreparedOrderArchiveDownload,
  type PreparedOrderArchiveDownloadResponse,
} from "~/actions/orders/downloads";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Progress } from "~/components/ui/progress";
import { Separator } from "~/components/ui/separator";
import {
  parseAudioMetadata,
  type ParsedAudioMetadata,
} from "~/lib/audio/wav-metadata";
import {
  getNormalizedUploadKey,
  validateSongFileMetadata,
} from "~/lib/orders/upload-validation";
import { cn } from "~/lib/utils";
import type {
  OrderDetail,
  OrderServiceType,
  OrderSongSpec,
} from "~/types/orders";

const workflowStatusLabels = {
  "awaiting-files": "Awaiting Files",
  queued: "Queued",
  "in-progress": "In Progress",
  "awaiting-feedback": "Awaiting Feedback",
  "revision-in-progress": "Revision In Progress",
  completed: "Completed",
  "on-hold": "On Hold",
  cancelled: "Cancelled",
} as const;

const workflowStatusBadgeClassNames = {
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
} as const;

const serviceTypeLabels: Record<OrderServiceType, string> = {
  mixing: "Mixing",
  mastering: "Mastering",
  "mixing-and-mastering": "Mixing + Mastering",
  "studio-service": "Studio Service",
};

type UploadResult = {
  message: string;
  rejectedFiles?: {
    fileName: string;
    relativePath: string | null;
    validationMessages: string[];
  }[];
};

type UploadState = {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  message?: string;
  rejectedFiles?: UploadResult["rejectedFiles"];
};

type PendingSongFile = {
  clientUploadId: string;
  file: File;
  fileName: string;
  metadata: ParsedAudioMetadata;
  progress: number;
  relativePath: string | null;
  replaceAssetId: string | null;
  songSpecId: string;
  status:
    | "ready"
    | "uploading"
    | "retrying"
    | "finalizing"
    | "completed"
    | "error";
  uploadedBytes: number;
};

type SubmissionPhase =
  | "ready"
  | "uploading"
  | "finalizing"
  | "success"
  | "error";

type ArchiveDownloadState = {
  archives: PreparedOrderArchiveDownload[];
  expiresAt: string | null;
  error: string | null;
  status: "idle" | "loading" | "ready" | "error";
};

const archiveActionButtonClassName =
  "cursor-pointer rounded-md border border-border bg-background text-sm font-medium leading-none shadow-sm transition-colors hover:bg-muted/60 disabled:cursor-not-allowed";

const archiveIconButtonClassName =
  "cursor-pointer rounded-md border border-border bg-background shadow-sm transition-colors hover:bg-muted/60 disabled:cursor-not-allowed";

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);

const formatDuration = (value: number | null) => {
  if (value === null) {
    return "Not captured";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const getServiceBadges = (serviceType: OrderServiceType) =>
  serviceType === "mixing-and-mastering"
    ? ["mixing", "mastering"]
    : [serviceType];

const getExpectedUnitLabel = (songSpec: OrderSongSpec) => {
  if (songSpec.sourceType === "mixing-tracks") {
    return "tracks";
  }

  if (songSpec.sourceType === "mastering-stems") {
    return "stems";
  }

  return "files";
};

const usesCappedSourceCount = (songSpec: OrderSongSpec) =>
  songSpec.sourceType === "mixing-tracks" ||
  songSpec.sourceType === "mastering-stems";

const getMinimumRequiredSourceCount = (songSpec: OrderSongSpec) =>
  usesCappedSourceCount(songSpec) ? 1 : (songSpec.expectedSourceCount ?? 1);

const getSongCompletion = (songSpec: OrderSongSpec) => {
  const validCount = songSpec.sourceAssets.length;
  const requiredCount = getMinimumRequiredSourceCount(songSpec);
  const isCappedSourceCount = usesCappedSourceCount(songSpec);
  const isComplete = validCount >= requiredCount;

  return {
    validCount,
    requiredCount,
    displayValue:
      isCappedSourceCount && songSpec.expectedSourceCount !== null
        ? `${validCount} uploaded · max ${songSpec.expectedSourceCount}`
        : `${validCount} / ${requiredCount}`,
    percent: isCappedSourceCount
      ? (isComplete ? 100 : 0)
      : Math.min(Math.round((validCount / requiredCount) * 100), 100),
    isComplete,
  };
};

const isHiResOnlySampleRate = (sampleRates: number[]) =>
  sampleRates.length === 1 && sampleRates[0] === 96000;

const isDefaultSampleRateSet = (sampleRates: number[]) =>
  sampleRates.length === 2 &&
  sampleRates.includes(44100) &&
  sampleRates.includes(48000);

const getSampleRateRuleSummary = (songSpecs: OrderSongSpec[]) => {
  const hiResSongCount = songSpecs.filter((songSpec) =>
    isHiResOnlySampleRate(songSpec.allowedSampleRates),
  ).length;
  const defaultRateSongCount = songSpecs.filter((songSpec) =>
    isDefaultSampleRateSet(songSpec.allowedSampleRates),
  ).length;

  if (hiResSongCount > 0 && defaultRateSongCount === 0) {
    return {
      label: "Required sample rate",
      value: "96 kHz",
    };
  }

  if (defaultRateSongCount > 0 && hiResSongCount === 0) {
    return {
      label: "Required sample rates",
      value: "44.1 / 48 kHz",
    };
  }

  if (hiResSongCount > 0 && defaultRateSongCount > 0) {
    return {
      label: "Sample rate rules",
      value: "Per-song. Hi-res songs require 96 kHz; other songs require 44.1 / 48 kHz.",
    };
  }

  return null;
};

const getPerSongEnforcementNotes = (songSpecs: OrderSongSpec[]) => {
  const notes = [
    "Song length is enforced against the duration quoted in the cart (+/- 2 seconds).",
  ];

  if (songSpecs.some((songSpec) => songSpec.expectedTrackCount !== null)) {
    notes.push(
      "Mixing songs cap uploads at the purchased track count for each song. You may submit fewer tracks, but not more.",
    );
  }

  if (songSpecs.some((songSpec) => songSpec.expectedStemCount !== null)) {
    notes.push(
      "Stem-mastering songs cap uploads at the purchased stem count for each song. You may submit fewer stems, but not more.",
    );
  }

  if (
    songSpecs.some(
      (songSpec) =>
        songSpec.sourceType === "mastering-file" &&
        songSpec.expectedSourceCount === 1,
    )
  ) {
    notes.push(
      "Standard mastering songs accept one stereo source file per song.",
    );
  }

  if (
    songSpecs.some((songSpec) =>
      isHiResOnlySampleRate(songSpec.allowedSampleRates),
    )
  ) {
    notes.push(
      "Songs with the hi-res delivery option enforce a 96 kHz source sample rate.",
    );
  }

  return notes;
};

const optionBadgeLabels: Record<string, string> = {
  "Vocal production add-on": "Vocal Production",
  "Drum replacement add-on": "Drum Replacement",
  "Guitar re-amp add-on": "Guitar Re-Amp",
  "Mixed stems deliverable included": "Mixed Stems",
  "Film mixdown deliverable included": "Film Mixdown",
  "Hi-res mixdown deliverable included": "Hi-Res Mixdown",
  "Extended archival included": "Extended Archival",
  "Rush delivery included": "Rush Delivery",
  "Vinyl mastering add-on": "Vinyl Mastering",
  "Streaming mastering add-on": "Streaming Mastering",
  "Red Book mastering add-on": "Red Book Mastering",
  "Stem mastering add-on": "Stem Mastering",
  "Restoration / remastering add-on": "Restoration",
  "Hi-res master deliverable included": "Hi-Res Master",
  "DDP image deliverable included": "DDP Image",
  "ISRC encoding included": "ISRC Encoding",
};

const optionBadgeClassNames: Record<string, string> = {
  "Vocal Production":
    "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  "Drum Replacement":
    "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Guitar Re-Amp":
    "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  "Mixed Stems":
    "border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-300",
  "Film Mixdown":
    "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  "Hi-Res Mixdown":
    "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  "Extended Archival":
    "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  "Rush Delivery":
    "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  "Vinyl Mastering":
    "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "Streaming Mastering":
    "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  "Red Book Mastering":
    "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  "Stem Mastering":
    "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
  Restoration:
    "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  "Hi-Res Master":
    "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  "DDP Image":
    "border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-300",
  "ISRC Encoding":
    "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
};

const getSongOptionBadges = (songSpec: OrderSongSpec) =>
  songSpec.requirements
    .map((requirement) => optionBadgeLabels[requirement])
    .filter((label): label is string => Boolean(label));

const getSongConstraintBadges = (songSpec: OrderSongSpec) =>
  songSpec.requirements.filter(
    (requirement) => optionBadgeLabels[requirement] === undefined,
  );

const normalizeConstraintRequirement = (
  songSpec: OrderSongSpec,
  requirement: string,
) => {
  const trackMatch = requirement.match(/^(\d+)\s+tracks?\s+expected$/i);
  if (trackMatch && songSpec.sourceType === "mixing-tracks") {
    return `Up to ${trackMatch[1]} tracks accepted`;
  }

  const stemMatch = requirement.match(/^(\d+)\s+stems?\s+expected$/i);
  if (stemMatch && songSpec.sourceType === "mastering-stems") {
    return `Up to ${stemMatch[1]} stems accepted`;
  }

  return requirement;
};

const getSourceCountCardLabel = (songSpec: OrderSongSpec) => {
  if (songSpec.sourceType === "mixing-tracks") {
    return "Track Limit";
  }

  if (songSpec.sourceType === "mastering-stems") {
    return "Stem Limit";
  }

  return "Source Count";
};

const getSourceCountCardValue = (songSpec: OrderSongSpec) => {
  if (
    usesCappedSourceCount(songSpec) &&
    songSpec.expectedSourceCount !== null
  ) {
    return `Up to ${songSpec.expectedSourceCount} ${getExpectedUnitLabel(songSpec)}`;
  }

  return `${songSpec.expectedSourceCount ?? "Flexible"} ${getExpectedUnitLabel(songSpec)}`;
};

const assetActionButtonClassName =
  "border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black";
const assetRemoveButtonClassName =
  "border border-red-600 text-red-600 hover:bg-red-600/30 hover:text-red-700 dark:text-red-500 dark:hover:bg-red-600/20 dark:hover:text-red-300";

const getAssetSlotLabel = (songSpec: OrderSongSpec, assetIndex: number) => {
  if (songSpec.sourceType === "mixing-tracks") {
    return `Track ${assetIndex + 1}`;
  }

  if (songSpec.sourceType === "mastering-stems") {
    return `Stem ${assetIndex + 1}`;
  }

  return assetIndex === 0 ? "Source File" : `Source File ${assetIndex + 1}`;
};

const SongAssetList = ({
  acceptedSourceExtensions,
  isUploading,
  onReplaceAsset,
  onRemoveAsset,
  orderUploadsLocked,
  replacementInputRefs,
  songSpec,
}: {
  acceptedSourceExtensions: string[];
  isUploading: boolean;
  onReplaceAsset: (songSpec: OrderSongSpec, assetId: string, files: FileList | null) => Promise<void>;
  onRemoveAsset: (songSpec: OrderSongSpec, assetId: string) => Promise<void>;
  orderUploadsLocked: boolean;
  replacementInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  songSpec: OrderSongSpec;
}) => {
  if (songSpec.sourceAssets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No source files uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {songSpec.sourceAssets.map((asset, assetIndex) => (
        <div
          key={asset.id}
          className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
        >
          <input
            type="file"
            accept={acceptedSourceExtensions.join(",")}
            className="hidden"
            ref={(node) => {
              replacementInputRefs.current[asset.id] = node;
            }}
            onChange={(event) => {
              void onReplaceAsset(songSpec, asset.id, event.target.files);
              event.currentTarget.value = "";
            }}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="w-fit">
                  {getAssetSlotLabel(songSpec, assetIndex)}
                </Badge>
                <FileAudio className="!h-4 !w-4 text-muted-foreground" />
                <p className="font-medium">{asset.fileName}</p>
                <Badge variant="outline" className="w-fit">
                  {asset.bitDepth ? `${asset.bitDepth}-bit` : "Bit depth pending"}
                </Badge>
                <Badge variant="outline" className="w-fit">
                  {asset.sampleRateHz
                    ? `${asset.sampleRateHz / 1000} kHz`
                    : "Sample rate pending"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {asset.durationSeconds
                  ? `${asset.durationSeconds.toFixed(2)} sec`
                  : "Duration pending"}
                {" · "}
                Uploaded {format(new Date(asset.uploadedAt), "MMM d, yyyy")}
              </p>
              {asset.originalRelativePath && (
                <p className="break-all text-xs text-muted-foreground">
                  {asset.originalRelativePath}
                </p>
              )}
            </div>
            {!orderUploadsLocked && (
              <div className="flex w-fit items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("w-fit", assetActionButtonClassName)}
                  disabled={isUploading}
                  onClick={() => replacementInputRefs.current[asset.id]?.click()}
                >
                  <RefreshCcw className="!h-4 !w-4" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn("w-fit", assetRemoveButtonClassName)}
                  disabled={isUploading}
                  onClick={() => {
                    void onRemoveAsset(songSpec, asset.id);
                  }}
                >
                  <Trash2 className="!h-4 !w-4" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const PendingSongFileList = ({
  onRemovePendingFile,
  pendingFiles,
  songSpec,
}: {
  onRemovePendingFile: (songSpecId: string, clientUploadId: string) => void;
  pendingFiles: PendingSongFile[];
  songSpec: OrderSongSpec;
}) => {
  if (pendingFiles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {pendingFiles.map((pendingFile, assetIndex) => (
        <div
          key={pendingFile.clientUploadId}
          className="flex flex-col gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="w-fit border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                >
                  {pendingFile.replaceAssetId
                    ? "Replacement Ready"
                    : "Ready to Submit"}
                </Badge>
                <Badge variant="outline" className="w-fit">
                  {getAssetSlotLabel(songSpec, assetIndex)}
                </Badge>
                <FileAudio className="!h-4 !w-4 text-muted-foreground" />
                <p className="font-medium">{pendingFile.fileName}</p>
                <Badge variant="outline" className="w-fit">
                  {pendingFile.metadata.bitDepth}-bit
                </Badge>
                <Badge variant="outline" className="w-fit">
                  {pendingFile.metadata.sampleRateHz / 1000} kHz
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingFile.metadata.durationSeconds.toFixed(2)} sec
                {" · "}
                {formatBytes(pendingFile.file.size)}
              </p>
              {pendingFile.relativePath && (
                <p className="break-all text-xs text-muted-foreground">
                  {pendingFile.relativePath}
                </p>
              )}
            </div>
            <div className="flex w-fit items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("w-fit", assetRemoveButtonClassName)}
                onClick={() =>
                  onRemovePendingFile(songSpec.id, pendingFile.clientUploadId)
                }
              >
                <Trash2 className="!h-4 !w-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const OptionBadge = ({ label }: { label: string }) => (
  <Badge
    variant="outline"
    className={cn(
      "inline-flex items-center gap-1.5",
      optionBadgeClassNames[label],
    )}
  >
    <CheckCircle2 className="!h-3.5 !w-3.5" />
    <span>{label}</span>
  </Badge>
);

const WAVE_HEADER_READ_BYTES = 1024 * 1024;
const FILE_UPLOAD_CONCURRENCY = 3;
const MULTIPART_PART_CONCURRENCY = 4;
const MAX_UPLOAD_ATTEMPTS = 5;

const formatBytes = (value: number) => {
  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let nextValue = value;
  let unitIndex = -1;

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024;
    unitIndex += 1;
  }

  return `${nextValue.toFixed(nextValue >= 100 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatEta = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) {
    return "Calculating";
  }

  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const sleep = (milliseconds: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const readLocalAudioMetadata = async (file: File) => {
  const headerBytes = await file.slice(0, WAVE_HEADER_READ_BYTES).arrayBuffer();
  return parseAudioMetadata(file.name, headerBytes);
};

const uploadBlobToPresignedUrl = async ({
  blob,
  contentType,
  onProgress,
  url,
}: {
  blob: Blob;
  contentType: string;
  onProgress: (loadedBytes: number) => void;
  url: string;
}) =>
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded);
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(blob.size);
        resolve();
        return;
      }

      reject(
        new Error(
          `Upload failed with status ${request.status}.`,
        ),
      );
    };

    request.onerror = () => {
      reject(new Error("Upload failed before the object store accepted it."));
    };

    request.send(blob);
  });

const uploadMultipartToPresignedUrls = async ({
  file,
  instruction,
  onProgress,
  onRetry,
}: {
  file: File;
  instruction: Extract<PreparedOrderUpload, { kind: "multipart" }>;
  onProgress: (loadedBytes: number) => void;
  onRetry: (attempt: number) => void;
}) => {
  const uploadedBytesByPart = new Array(instruction.parts.length).fill(0);
  const completedParts: {
    eTag: string;
    partNumber: number;
  }[] = [];
  const pendingParts = [...instruction.parts];

  const uploadPart = async ({
    partNumber,
    url,
  }: {
    partNumber: number;
    url: string;
  }) => {
    const start = (partNumber - 1) * instruction.partSizeBytes;
    const end = Math.min(start + instruction.partSizeBytes, file.size);
    const blob = file.slice(start, end);
    let attempt = 0;

    while (attempt < MAX_UPLOAD_ATTEMPTS) {
      try {
        const eTag = await new Promise<string>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("PUT", url);
          request.setRequestHeader("Content-Type", instruction.contentType);

          request.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              uploadedBytesByPart[partNumber - 1] = event.loaded;
              onProgress(
                uploadedBytesByPart.reduce(
                  (total, currentValue) => total + currentValue,
                  0,
                ),
              );
            }
          };

          request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
              uploadedBytesByPart[partNumber - 1] = blob.size;
              onProgress(
                uploadedBytesByPart.reduce(
                  (total, currentValue) => total + currentValue,
                  0,
                ),
              );
              resolve(
                request.getResponseHeader("ETag")?.replaceAll('"', "") ??
                  "",
              );
              return;
            }

            reject(
              new Error(
                `Part ${partNumber} failed with status ${request.status}.`,
              ),
            );
          };

          request.onerror = () => {
            reject(new Error(`Part ${partNumber} failed before completion.`));
          };

          request.send(blob);
        });

        completedParts.push({
          eTag,
          partNumber,
        });
        return;
      } catch (error) {
        attempt += 1;
        uploadedBytesByPart[partNumber - 1] = 0;
        onRetry(attempt);

        if (attempt >= MAX_UPLOAD_ATTEMPTS) {
          throw error;
        }

        await sleep(500 * 2 ** (attempt - 1) + Math.round(Math.random() * 300));
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(MULTIPART_PART_CONCURRENCY, pendingParts.length) }, async () => {
      while (pendingParts.length > 0) {
        const nextPart = pendingParts.shift();

        if (!nextPart) {
          return;
        }

        await uploadPart(nextPart);
      }
    }),
  );

  return completedParts.sort((left, right) => left.partNumber - right.partNumber);
};

export function OrderDetailClient({ order }: { order: OrderDetail }) {
  const router = useRouter();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = React.useState(false);
  const [draggingSongId, setDraggingSongId] = React.useState<string | null>(
    null,
  );
  const [pendingFilesBySongId, setPendingFilesBySongId] = React.useState<
    Record<string, PendingSongFile[]>
  >({});
  const [uploadStateBySongId, setUploadStateBySongId] = React.useState<
    Record<string, UploadState>
  >({});
  const [submissionError, setSubmissionError] = React.useState<string | null>(
    null,
  );
  const [submissionPhase, setSubmissionPhase] =
    React.useState<SubmissionPhase>("ready");
  const [submissionStartedAt, setSubmissionStartedAt] = React.useState<
    number | null
  >(null);
  const [archiveDownloadState, setArchiveDownloadState] =
    React.useState<ArchiveDownloadState>({
      archives: [],
      expiresAt: null,
      error: null,
      status: "idle",
    });
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const replacementInputRefs = React.useRef<
    Record<string, HTMLInputElement | null>
  >({});
  const sampleRateRuleSummary = getSampleRateRuleSummary(order.songSpecs);
  const perSongEnforcementNotes = getPerSongEnforcementNotes(order.songSpecs);
  const stagedFiles = Object.values(pendingFilesBySongId).flat();
  const canRequestArchiveDownloads =
    order.workflowStatus === "awaiting-feedback" ||
    order.workflowStatus === "completed";
  const readyPendingFiles = stagedFiles.filter(
    (pendingFile) =>
      pendingFile.status !== "completed" && pendingFile.status !== "error",
  );
  const totalPendingBytes = readyPendingFiles.reduce(
    (total, pendingFile) => total + pendingFile.file.size,
    0,
  );

  const setSongUploadState = (songId: string, nextState: UploadState) => {
    setUploadStateBySongId((currentState) => ({
      ...currentState,
      [songId]: nextState,
    }));
  };

  const handlePrepareArchiveDownloads = async () => {
    setArchiveDownloadState((currentState) => ({
      ...currentState,
      error: null,
      status: "loading",
    }));
    return await prepareArchiveDownloads(false);
  };

  const handleRefreshArchiveDownloads = async () => {
    setArchiveDownloadState((currentState) => ({
      ...currentState,
      error: null,
      status: "loading",
    }));

    return await prepareArchiveDownloads(true);
  };

  const prepareArchiveDownloads = async (forceRefresh: boolean) => {
    try {
      const archiveDownloadResponse = await prepareOrderArchiveDownloads({
        forceRefresh,
        orderId: order.id,
      });
      setArchiveDownloadState({
        archives: archiveDownloadResponse.archives,
        expiresAt: archiveDownloadResponse.expiresAt,
        error: null,
        status: "ready",
      });
    } catch (error) {
      setArchiveDownloadState({
        archives: [],
        expiresAt: null,
        error:
          error instanceof Error
            ? error.message
            : "Download links could not be prepared.",
        status: "error",
      });
    }
  };

  const archiveDownloadExpiryLabel =
    archiveDownloadState.expiresAt !== null
      ? format(new Date(archiveDownloadState.expiresAt), "MMMM d, yyyy 'at' h:mm a")
      : null;

  const archiveLinkControlLabel =
    archiveDownloadState.status === "loading"
      ? "Preparing..."
      : archiveDownloadState.status === "ready"
        ? "Download Links Ready"
        : "Generate Download Link";

  const renderArchiveDownloadControl = () => {
    if (!canRequestArchiveDownloads) {
      return null;
    }

    if (archiveDownloadState.status === "ready") {
      return (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <Badge
            variant="outline"
            className="h-9 px-3 text-sm font-medium leading-none"
          >
            Active for 2 hours
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`${archiveIconButtonClassName} h-9 w-9`}
            onClick={() => {
              void handleRefreshArchiveDownloads();
            }}
          >
            <RefreshCcw className="!h-3.5 !w-3.5" />
            <span className="sr-only">Regenerate archive download link</span>
          </Button>
        </div>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        size="default"
        className={`${archiveActionButtonClassName} h-9 px-3.5`}
        disabled={archiveDownloadState.status === "loading"}
        onClick={() => {
          void handlePrepareArchiveDownloads();
        }}
      >
        <Download className="!h-3.5 !w-3.5" />
        {archiveLinkControlLabel}
      </Button>
    );
  };

  const renderArchiveDownloadSection = () => {
    if (!canRequestArchiveDownloads) {
      return null;
    }

    return (
      <Card id="archive-downloads">
        <CardHeader className="space-y-3 text-center sm:text-left">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base sm:text-lg">
              Completed Session Archive
            </CardTitle>
            <div className="flex w-full justify-center sm:w-auto sm:justify-end">
              {renderArchiveDownloadControl()}
            </div>
          </div>
          <CardDescription>
            Download the completed order as the private multipart zip archive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {archiveDownloadState.status === "ready" ? (
            archiveDownloadState.archives.length > 0 ? (
              archiveDownloadState.archives.map((archive) => (
                <div
                  key={archive.archiveId}
                  className="space-y-4 rounded-lg border bg-muted/20 p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{archive.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Download every part and keep them together before extracting
                      the archive.
                    </p>
                    {archiveDownloadExpiryLabel ? (
                      <p className="text-xs text-muted-foreground">
                        Expires {archiveDownloadExpiryLabel}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {archive.parts.map((part) => (
                      <Button
                        key={part.assetId}
                        asChild
                        variant="outline"
                        size="sm"
                        className={`${archiveActionButtonClassName} h-9 justify-start px-3`}
                      >
                        <a href={part.url} rel="noreferrer" target="_blank">
                          <Download className="!h-3.5 !w-3.5" />
                          {part.fileName}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                No multipart delivery archive has been published for this order
                yet.
              </p>
            )
          ) : archiveDownloadState.status === "error" ? (
            <Alert variant="destructive">
              <AlertCircle className="!h-4 !w-4" />
              <AlertTitle>Could not prepare download links</AlertTitle>
              <AlertDescription>{archiveDownloadState.error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate the private archive link set when you are ready. Only one
              active link set is kept at a time, and you can regenerate it if it
              expires or fails.
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const updatePendingFile = (
    songSpecId: string,
    clientUploadId: string,
    updater: (pendingFile: PendingSongFile) => PendingSongFile,
  ) => {
    setPendingFilesBySongId((currentState) => ({
      ...currentState,
      [songSpecId]:
        currentState[songSpecId]?.map((pendingFile) =>
          pendingFile.clientUploadId === clientUploadId
            ? updater(pendingFile)
            : pendingFile,
        ) ?? [],
    }));
  };

  const removePendingFile = (songSpecId: string, clientUploadId: string) => {
    setPendingFilesBySongId((currentState) => ({
      ...currentState,
      [songSpecId]: (currentState[songSpecId] ?? []).filter(
        (pendingFile) => pendingFile.clientUploadId !== clientUploadId,
      ),
    }));
  };

  const getProjectedSongCompletion = (songSpec: OrderSongSpec) => {
    const pendingSongFiles = (pendingFilesBySongId[songSpec.id] ?? []).filter(
      (pendingFile) =>
        pendingFile.status !== "completed" && pendingFile.status !== "error",
    );
    const replacementIds = new Set(
      pendingSongFiles
        .map((pendingFile) => pendingFile.replaceAssetId)
        .filter((value): value is string => Boolean(value)),
    );
    const projectedValidCount =
      songSpec.sourceAssets.length - replacementIds.size + pendingSongFiles.length;

    return {
      isComplete:
        projectedValidCount >= getMinimumRequiredSourceCount(songSpec),
      projectedValidCount,
    };
  };

  const projectedReadySongCount = order.songSpecs.filter((songSpec) =>
    getProjectedSongCompletion(songSpec).isComplete,
  ).length;
  const submissionReadinessPercent =
    order.songSpecs.length > 0
      ? Math.round((projectedReadySongCount / order.songSpecs.length) * 100)
      : 0;
  const totalUploadedBytes = stagedFiles.reduce(
    (total, pendingFile) => total + pendingFile.uploadedBytes,
    0,
  );
  const elapsedSeconds = submissionStartedAt
    ? (Date.now() - submissionStartedAt) / 1000
    : null;
  const throughputBytesPerSecond =
    elapsedSeconds && elapsedSeconds > 0
      ? totalUploadedBytes / elapsedSeconds
      : null;
  const etaSeconds =
    throughputBytesPerSecond && throughputBytesPerSecond > 0
      ? Math.max(
          (totalPendingBytes - totalUploadedBytes) / throughputBytesPerSecond,
          0,
        )
      : null;
  const showSubmitButton = !order.uploadsLocked && readyPendingFiles.length > 0;

  const stageSongFiles = async (
    songSpec: OrderSongSpec,
    files: File[],
    options?: {
      replaceAssetId?: string;
    },
  ) => {
    if (files.length === 0) {
      return;
    }

    if (options?.replaceAssetId && files.length !== 1) {
      setSongUploadState(songSpec.id, {
        progress: 0,
        status: "error",
        message:
          "Replacing an uploaded source requires exactly one replacement file.",
      });
      return;
    }

    const parsedEntries = await Promise.all(
      files.map(async (file) => {
        const relativePath = file.webkitRelativePath || null;

        try {
          const metadata = await readLocalAudioMetadata(file);
          const validationMessages = validateSongFileMetadata({
            metadata,
            songSpec,
          });

          return {
            file,
            metadata,
            relativePath,
            validationMessages,
          };
        } catch (error) {
          return {
            file,
            metadata: null,
            relativePath,
            validationMessages: [
              error instanceof Error
                ? error.message
                : "Could not read this audio file.",
            ],
          };
        }
      }),
    );

    const rejectedFiles = parsedEntries
      .filter(
        (entry) =>
          entry.validationMessages.length > 0 || entry.metadata === null,
      )
      .map((entry) => ({
        fileName: entry.file.name,
        relativePath: entry.relativePath,
        validationMessages: entry.validationMessages,
      }));

    const nextPendingFiles = parsedEntries
      .filter(
        (entry): entry is typeof entry & { metadata: ParsedAudioMetadata } =>
          entry.validationMessages.length === 0 && entry.metadata !== null,
      )
      .map((entry) => ({
        clientUploadId: crypto.randomUUID(),
        file: entry.file,
        fileName: entry.file.name,
        metadata: entry.metadata,
        progress: 0,
        relativePath: entry.relativePath,
        replaceAssetId: options?.replaceAssetId ?? null,
        songSpecId: songSpec.id,
        status: "ready" as const,
        uploadedBytes: 0,
      }));

    const currentSongPendingFiles = pendingFilesBySongId[songSpec.id] ?? [];
    const filteredSongPendingFiles = currentSongPendingFiles.filter(
      (pendingFile) =>
        !nextPendingFiles.some((nextPendingFile) => {
          if (
            nextPendingFile.replaceAssetId &&
            pendingFile.replaceAssetId === nextPendingFile.replaceAssetId
          ) {
            return true;
          }

          return (
            getNormalizedUploadKey(nextPendingFile) ===
            getNormalizedUploadKey(pendingFile)
          );
        }),
    );
    const acceptedPendingFiles = [...filteredSongPendingFiles];
    const overflowRejectedFiles: UploadResult["rejectedFiles"] = [];

    nextPendingFiles.forEach((nextPendingFile) => {
      if (songSpec.expectedSourceCount === null) {
        acceptedPendingFiles.push(nextPendingFile);
        return;
      }

      const replacementIds = new Set(
        acceptedPendingFiles
          .map((pendingFile) => pendingFile.replaceAssetId)
          .filter((value): value is string => Boolean(value)),
      );
      const projectedReplacementIds = new Set(replacementIds);

      if (nextPendingFile.replaceAssetId) {
        projectedReplacementIds.add(nextPendingFile.replaceAssetId);
      }

      const projectedCount =
        songSpec.sourceAssets.length -
        projectedReplacementIds.size +
        acceptedPendingFiles.length +
        1;

      if (projectedCount > songSpec.expectedSourceCount) {
        overflowRejectedFiles.push({
          fileName: nextPendingFile.fileName,
          relativePath: nextPendingFile.relativePath,
          validationMessages: [
            `This song accepts ${getSourceCountCardValue(songSpec)}.`,
          ],
        });
        return;
      }

      acceptedPendingFiles.push(nextPendingFile);
    });

    setPendingFilesBySongId((currentState) => ({
      ...currentState,
      [songSpec.id]: acceptedPendingFiles,
    }));

    const acceptedCount = nextPendingFiles.length - overflowRejectedFiles.length;
    const finalRejectedFiles = [...rejectedFiles, ...overflowRejectedFiles];

    setSongUploadState(songSpec.id, {
      progress: acceptedCount > 0 ? 100 : 0,
      status: acceptedCount > 0 ? "success" : "error",
      message:
        options?.replaceAssetId
          ? acceptedCount > 0
            ? "Replacement file is ready to submit."
            : "The replacement file could not be staged."
          : acceptedCount > 0
            ? `Staged ${acceptedCount} file${acceptedCount === 1 ? "" : "s"} for submission.`
            : "No files were staged because every file failed validation.",
      rejectedFiles: finalRejectedFiles.length > 0 ? finalRejectedFiles : undefined,
    });
  };

  const handleSongUpload = async (
    songSpec: OrderSongSpec,
    fileList: FileList | null,
  ) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    await stageSongFiles(songSpec, Array.from(fileList));
  };

  const handleAssetReplacement = async (
    songSpec: OrderSongSpec,
    assetId: string,
    fileList: FileList | null,
  ) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const replacementFile = fileList.item(0);

    if (!replacementFile) {
      return;
    }

    await stageSongFiles(songSpec, [replacementFile], {
      replaceAssetId: assetId,
    });
  };

  const handleAssetRemoval = async (
    songSpec: OrderSongSpec,
    assetId: string,
  ) => {
    setSongUploadState(songSpec.id, {
      progress: 0,
      status: "uploading",
      message: "Removing file...",
    });

    const response = await fetch(`/api/account/orders/${order.id}/uploads`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        songSpecId: songSpec.id,
        assetId,
      }),
    });

    const payload = (await response.json().catch(() => null)) as UploadResult | null;

    if (!response.ok) {
      setSongUploadState(songSpec.id, {
        progress: 0,
        status: "error",
        message: payload?.message ?? "Could not remove the file.",
      });
      return;
    }

    setSongUploadState(songSpec.id, {
      progress: 100,
      status: "success",
      message: payload?.message ?? "File removed successfully.",
    });
    setPendingFilesBySongId((currentState) => ({
      ...currentState,
      [songSpec.id]: (currentState[songSpec.id] ?? []).filter(
        (pendingFile) => pendingFile.replaceAssetId !== assetId,
      ),
    }));
    React.startTransition(() => {
      router.refresh();
    });
  };

  const submitPendingFile = async ({
    instruction,
    pendingFile,
  }: {
    instruction: PreparedOrderUpload;
    pendingFile: PendingSongFile;
  }) => {
    const setPendingStatus = (
      status: PendingSongFile["status"],
      progress: number,
      uploadedBytes: number,
    ) => {
      updatePendingFile(
        pendingFile.songSpecId,
        pendingFile.clientUploadId,
        (currentPendingFile) => ({
          ...currentPendingFile,
          progress,
          status,
          uploadedBytes,
        }),
      );
    };

    const uploadSinglePartFile = async (
      singlePartInstruction: Extract<PreparedOrderUpload, { kind: "single-part" }>,
    ) => {
      let attempt = 0;

      while (attempt < MAX_UPLOAD_ATTEMPTS) {
        try {
          await uploadBlobToPresignedUrl({
            blob: pendingFile.file,
            contentType: singlePartInstruction.contentType,
            onProgress: (loadedBytes) => {
              setPendingStatus(
                attempt > 0 ? "retrying" : "uploading",
                Math.min(
                  Math.round((loadedBytes / pendingFile.file.size) * 100),
                  100,
                ),
                loadedBytes,
              );
            },
            url: singlePartInstruction.uploadUrl,
          });
          return;
        } catch (error) {
          attempt += 1;

          if (attempt >= MAX_UPLOAD_ATTEMPTS) {
            throw error;
          }

          setPendingStatus("retrying", 0, 0);
          await sleep(500 * 2 ** (attempt - 1) + Math.round(Math.random() * 300));
        }
      }
    };

    if (instruction.kind === "single-part") {
      await uploadSinglePartFile(instruction);
      setPendingStatus("finalizing", 100, pendingFile.file.size);

      await completePreparedOrderUpload({
        orderId: order.id,
        file: {
          clientUploadId: pendingFile.clientUploadId,
          songSpecId: pendingFile.songSpecId,
          fileName: pendingFile.fileName,
          relativePath: pendingFile.relativePath,
          byteSize: pendingFile.file.size,
          mimeType: pendingFile.file.type || null,
          replaceAssetId: pendingFile.replaceAssetId,
          objectKey: instruction.objectKey,
          uploadKind: instruction.kind,
        },
      });

      setPendingStatus("completed", 100, pendingFile.file.size);
      return;
    }

    setPendingStatus("uploading", 0, 0);
    const completedParts = await uploadMultipartToPresignedUrls({
      file: pendingFile.file,
      instruction,
      onProgress: (loadedBytes) => {
        setPendingStatus(
          "uploading",
          Math.min(
            Math.round((loadedBytes / pendingFile.file.size) * 100),
            100,
          ),
          loadedBytes,
        );
      },
      onRetry: () => {
        setPendingStatus("retrying", 0, 0);
      },
    });
    setPendingStatus("finalizing", 100, pendingFile.file.size);

    await completePreparedOrderUpload({
      orderId: order.id,
      file: {
        clientUploadId: pendingFile.clientUploadId,
        songSpecId: pendingFile.songSpecId,
        fileName: pendingFile.fileName,
        relativePath: pendingFile.relativePath,
        byteSize: pendingFile.file.size,
        mimeType: pendingFile.file.type || null,
        replaceAssetId: pendingFile.replaceAssetId,
        objectKey: instruction.objectKey,
        uploadKind: instruction.kind,
        uploadId: instruction.uploadId,
        completedParts,
      },
    });

    setPendingStatus("completed", 100, pendingFile.file.size);
  };

  const handleSubmitFiles = async () => {
    if (readyPendingFiles.length === 0) {
      return;
    }

    setSubmissionError(null);
    setSubmissionPhase("uploading");
    setSubmissionStartedAt(Date.now());

    try {
      const preparedUploads = await prepareOrderUploadSubmission({
        orderId: order.id,
        files: readyPendingFiles.map(
          (pendingFile) =>
            ({
              clientUploadId: pendingFile.clientUploadId,
              songSpecId: pendingFile.songSpecId,
              fileName: pendingFile.fileName,
              relativePath: pendingFile.relativePath,
              byteSize: pendingFile.file.size,
              mimeType: pendingFile.file.type || null,
              replaceAssetId: pendingFile.replaceAssetId,
              clientMetadata: pendingFile.metadata,
            }) satisfies PreparedOrderUploadInput,
        ),
      });
      const preparedUploadsById = new Map(
        preparedUploads.map((preparedUpload) => [
          preparedUpload.clientUploadId,
          preparedUpload,
        ]),
      );
      const pendingQueue = [...readyPendingFiles];
      const completedUploadIds: string[] = [];
      const failedMessages: string[] = [];

      await Promise.all(
        Array.from(
          { length: Math.min(FILE_UPLOAD_CONCURRENCY, pendingQueue.length) },
          async () => {
            while (pendingQueue.length > 0) {
              const nextPendingFile = pendingQueue.shift();

              if (!nextPendingFile) {
                return;
              }

              const preparedUpload = preparedUploadsById.get(
                nextPendingFile.clientUploadId,
              );

              if (!preparedUpload) {
                failedMessages.push(
                  `${nextPendingFile.fileName}: upload instructions were not returned by the server.`,
                );
                updatePendingFile(
                  nextPendingFile.songSpecId,
                  nextPendingFile.clientUploadId,
                  (currentPendingFile) => ({
                    ...currentPendingFile,
                    status: "error",
                  }),
                );
                continue;
              }

              try {
                await submitPendingFile({
                  instruction: preparedUpload,
                  pendingFile: nextPendingFile,
                });
                completedUploadIds.push(nextPendingFile.clientUploadId);
              } catch (error) {
                failedMessages.push(
                  `${nextPendingFile.fileName}: ${
                    error instanceof Error
                      ? error.message
                      : "The upload could not be completed."
                  }`,
                );
                updatePendingFile(
                  nextPendingFile.songSpecId,
                  nextPendingFile.clientUploadId,
                  (currentPendingFile) => ({
                    ...currentPendingFile,
                    status: "error",
                  }),
                );
              }
            }
          },
        ),
      );

      setPendingFilesBySongId((currentState) =>
        Object.fromEntries(
          Object.entries(currentState).map(([songSpecId, pendingFiles]) => [
            songSpecId,
            pendingFiles.filter(
              (pendingFile) =>
                !completedUploadIds.includes(pendingFile.clientUploadId),
            ),
          ]),
        ),
      );

      if (completedUploadIds.length > 0) {
        React.startTransition(() => {
          router.refresh();
        });
      }

      if (failedMessages.length > 0) {
        setSubmissionError(failedMessages.join(" "));
        setSubmissionPhase("error");
        return;
      }

      setSubmissionPhase("success");
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "The order submission could not be prepared.",
      );
      setSubmissionPhase("error");
    }
  };

  return (
    <div className="mx-auto w-full space-y-6 py-6 xl:w-3/4">
      <Dialog
        open={isSubmitDialogOpen}
        onOpenChange={(nextOpen) => {
          if (
            !nextOpen &&
            (submissionPhase === "uploading" || submissionPhase === "finalizing")
          ) {
            return;
          }

          setIsSubmitDialogOpen(nextOpen);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ready to Submit</DialogTitle>
            <DialogDescription>
              {submissionPhase === "ready"
                ? "Submit your staged song files directly from the browser to durable storage."
                : submissionPhase === "success"
                  ? "All staged files finished uploading and were verified against this order."
                  : submissionPhase === "error"
                    ? "Some files could not be submitted. Fix the issue and retry the remaining files."
                    : "Uploading directly to durable storage. Keep this window open until verification finishes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Songs Ready</p>
                <p className="mt-1 text-lg font-semibold">
                  {projectedReadySongCount} / {order.songSpecs.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Staged Files</p>
                <p className="mt-1 text-lg font-semibold">
                  {readyPendingFiles.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Total Bytes</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatBytes(totalPendingBytes)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Submission Readiness</p>
                <p className="text-sm font-medium">
                  {submissionReadinessPercent}%
                </p>
              </div>
              <Progress value={submissionReadinessPercent} className="h-3" />
              <p className="text-sm text-muted-foreground">
                This reflects how many songs will satisfy their minimum upload
                requirement after this staged submission completes.
              </p>
            </div>

            {submissionPhase !== "ready" ? (
              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">Upload Progress</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      {formatBytes(totalUploadedBytes)} / {formatBytes(totalPendingBytes)}
                    </span>
                    <span>
                      {throughputBytesPerSecond
                        ? `${formatBytes(throughputBytesPerSecond)}/s`
                        : "Preparing"}
                    </span>
                    <span>ETA {formatEta(etaSeconds)}</span>
                  </div>
                </div>
                <Progress
                  value={
                    totalPendingBytes > 0
                      ? Math.min(
                          Math.round((totalUploadedBytes / totalPendingBytes) * 100),
                          100,
                        )
                      : 0
                  }
                  className="h-3"
                />
                <div className="space-y-2">
                  {stagedFiles.map((pendingFile) => (
                    <div
                      key={pendingFile.clientUploadId}
                      className="rounded-md border bg-background/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{pendingFile.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {pendingFile.status === "completed"
                              ? "Verified"
                              : pendingFile.status === "finalizing"
                                ? "Verifying uploaded object"
                                : pendingFile.status === "retrying"
                                  ? "Retrying upload"
                                  : pendingFile.status === "uploading"
                                    ? "Uploading"
                                    : pendingFile.status === "error"
                                      ? "Needs retry"
                                      : "Ready"}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pendingFile.progress}%
                        </p>
                      </div>
                      <Progress value={pendingFile.progress} className="mt-3 h-2" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {submissionError ? (
              <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
                <AlertCircle className="!h-4 !w-4" />
                <AlertTitle>Submission needs attention</AlertTitle>
                <AlertDescription>{submissionError}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
              onClick={() => setIsSubmitDialogOpen(false)}
              disabled={
                submissionPhase === "uploading" ||
                submissionPhase === "finalizing"
              }
            >
              Close
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex gap-1 border border-green-600 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/40 dark:hover:text-green-300"
              disabled={
                readyPendingFiles.length === 0 ||
                submissionPhase === "uploading" ||
                submissionPhase === "finalizing"
              }
              onClick={() => {
                void handleSubmitFiles();
              }}
            >
              <UploadCloud className="!h-4 !w-4" />
              {submissionPhase === "error" ? "Retry Files" : "Submit Files"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
        <Button
          asChild
          variant="outline"
          className="w-fit underline-offset-4 hover:underline"
        >
          <Link href="/account">
            <ArrowLeft className="mr-2 !h-4 !w-4" />
            Back to Account
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          {getServiceBadges(order.serviceType).map((serviceType) => (
            <Badge key={serviceType} variant="outline">
              {serviceTypeLabels[serviceType as OrderServiceType]}
            </Badge>
          ))}
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              workflowStatusBadgeClassNames[order.workflowStatus],
            )}
          >
            {workflowStatusLabels[order.workflowStatus]}
          </Badge>
          {showSubmitButton ? (
            <Button
              type="button"
              variant="ghost"
              className="flex gap-1 border border-green-600 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-900/40 dark:hover:text-green-300"
              onClick={() => {
                setSubmissionError(null);
                setSubmissionPhase("ready");
                setIsSubmitDialogOpen(true);
              }}
            >
              <UploadCloud className="!h-4 !w-4" />
              Submit Files
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {order.items
                  .map((item) => item.name.replace(/\s*\(\d+\s+song(?:s)?\)\s*$/i, ""))
                  .filter((value, index, values) => values.indexOf(value) === index)
                  .join(" / ")}
              </CardTitle>
              <CardDescription>
                Order placed {format(new Date(order.orderedAt), "MMMM d, yyyy")}
                {" · "}
                Ref #{order.checkoutSessionId.slice(-8).toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">
                    {formatCurrency(order.total, order.currency)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Songs Ready</p>
                  <p className="text-xl font-semibold">
                    {order.completedSongCount} / {order.songSpecs.length || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Source Files</p>
                  <p className="text-xl font-semibold">
                    {order.totalValidatedSourceFiles} / {order.totalExpectedSourceFiles}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">Project Progress</p>
                    <p className="text-sm text-muted-foreground">
                      Songs with validated source uploads across the entire order.
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {order.sourceCompletionPercent}%
                  </p>
                </div>
                <Progress value={order.sourceCompletionPercent} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {order.songSpecs.length === 0 && (
            <Alert className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200">
              <AlertCircle className="!h-4 !w-4" />
              <AlertTitle>Detailed upload tracking is unavailable</AlertTitle>
              <AlertDescription>
                This order can be viewed, but the detailed song-spec schema has
                not been applied yet, so upload validation is currently
                disabled.
              </AlertDescription>
            </Alert>
          )}

          {order.uploadsLocked && order.songSpecs.length > 0 && (
            <Alert>
              <Lock className="!h-4 !w-4" />
              <AlertTitle>Uploads are locked</AlertTitle>
              <AlertDescription>
                This project is already in production, so source uploads are now
                read-only from the client dashboard.
              </AlertDescription>
            </Alert>
          )}

          {renderArchiveDownloadSection()}

          <Accordion type="multiple" className="space-y-4">
            {order.songSpecs.map((songSpec, index) => {
              const completion = getSongCompletion(songSpec);
              const pendingSongFiles = (pendingFilesBySongId[songSpec.id] ?? []).filter(
                (pendingFile) => pendingFile.status !== "completed",
              );
              const projectedSongCompletion = getProjectedSongCompletion(songSpec);
              const optionBadges = getSongOptionBadges(songSpec);
              const constraintBadges = getSongConstraintBadges(songSpec);
              const uploadState = uploadStateBySongId[songSpec.id];
              const isUploading =
                uploadState?.status === "uploading" ||
                pendingSongFiles.some((pendingFile) =>
                  ["uploading", "retrying", "finalizing"].includes(
                    pendingFile.status,
                  ),
                );
              const canAcceptAdditionalSources =
                songSpec.expectedSourceCount === null ||
                projectedSongCompletion.projectedValidCount <
                  songSpec.expectedSourceCount;

              return (
                <AccordionItem
                  key={songSpec.id}
                  value={songSpec.id}
                  className="border-none"
                >
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-6">
                      <AccordionTrigger
                        chevronSide="fit"
                        className="w-full items-center justify-start gap-3 py-0 text-left hover:no-underline"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <Badge variant="outline">Song {index + 1}</Badge>
                            {getServiceBadges(songSpec.serviceType).map((serviceType) => (
                              <Badge key={serviceType} variant="outline">
                                {
                                  serviceTypeLabels[
                                    serviceType as OrderServiceType
                                  ]
                                }
                              </Badge>
                            ))}
                            <p className="truncate text-base font-semibold">
                              {songSpec.title}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "w-fit",
                                completion.isComplete
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                              )}
                            >
                              {completion.isComplete ? "Ready" : "Needs Files"}
                            </Badge>
                            <div className="rounded-md bg-muted/30 px-3 py-2 text-sm">
                              <span className="text-muted-foreground">
                                Uploaded {getExpectedUnitLabel(songSpec)}
                              </span>
                              <span className="ml-2 font-medium">
                                {completion.displayValue}
                              </span>
                            </div>
                            {pendingSongFiles.length > 0 ? (
                              <Badge
                                variant="outline"
                                className="w-fit border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              >
                                {pendingSongFiles.length} ready to submit
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </AccordionTrigger>
                    </CardHeader>
                    <AccordionContent className="px-6 pb-6 pt-0">
                      <div className="space-y-2">
                        <p className="text-xl font-semibold">{songSpec.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {songSpec.sessionName}
                        </p>
                      </div>

                      <div className="mt-5 space-y-5">
                        <div className="space-y-2 rounded-lg bg-muted/30 p-4">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-muted-foreground">
                              Uploaded {getExpectedUnitLabel(songSpec)}
                            </span>
                            <span className="font-medium">
                              {completion.displayValue}
                            </span>
                          </div>
                          <Progress value={completion.percent} />
                          <p className="text-xs text-muted-foreground">
                            {completion.isComplete
                              ? usesCappedSourceCount(songSpec)
                                ? "At least one validated source is uploaded for this song. You can still replace or remove individual files."
                                : "Source intake complete for this song."
                              : "Upload files for this song to begin intake."}
                          </p>
                        </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Target Length
                        </p>
                        <p className="mt-1 font-medium">
                          {formatDuration(songSpec.expectedDurationSeconds)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {getSourceCountCardLabel(songSpec)}
                        </p>
                        <p className="mt-1 font-medium">
                          {getSourceCountCardValue(songSpec)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Sample Rate
                        </p>
                        <p className="mt-1 font-medium">
                          {songSpec.allowedSampleRates
                            .map((rate) => `${rate / 1000} kHz`)
                            .join(" / ")}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Bit Depth
                        </p>
                        <p className="mt-1 font-medium">
                          {songSpec.allowedBitDepths.join(" / ")}-bit
                        </p>
                      </div>
                    </div>

                    {optionBadges.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Selected Options
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {optionBadges.map((label) => (
                            <OptionBadge key={label} label={label} />
                          ))}
                        </div>
                      </div>
                    )}

                    {constraintBadges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {constraintBadges.map((requirement) => (
                          <Badge key={requirement} variant="secondary">
                            {normalizeConstraintRequirement(
                              songSpec,
                              requirement,
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {!order.uploadsLocked &&
                      (canAcceptAdditionalSources ? (
                        <div className="space-y-3">
                          <input
                            type="file"
                            multiple
                            accept={order.acceptedSourceExtensions.join(",")}
                            className="hidden"
                            ref={(node) => {
                              fileInputRefs.current[songSpec.id] = node;
                            }}
                            onChange={(event) => {
                              void handleSongUpload(songSpec, event.target.files);
                              event.currentTarget.value = "";
                            }}
                          />
                          <div
                            className={cn(
                              "cursor-pointer rounded-xl border border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              draggingSongId === songSpec.id
                                ? "border-foreground bg-muted/40"
                                : "border-border bg-muted/20",
                            )}
                            role="button"
                            tabIndex={0}
                            onClick={() => fileInputRefs.current[songSpec.id]?.click()}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                fileInputRefs.current[songSpec.id]?.click();
                              }
                            }}
                            onDragOver={(event) => {
                              event.preventDefault();
                              setDraggingSongId(songSpec.id);
                            }}
                            onDragLeave={(event) => {
                              event.preventDefault();
                              setDraggingSongId((currentSongId) =>
                                currentSongId === songSpec.id ? null : currentSongId,
                              );
                            }}
                            onDrop={(event) => {
                              event.preventDefault();
                              setDraggingSongId(null);
                              void stageSongFiles(
                                songSpec,
                                Array.from(event.dataTransfer.files),
                              );
                            }}
                          >
                            <UploadCloud className="mx-auto mb-3 !h-7 !w-7 text-muted-foreground" />
                            <p className="font-medium">
                              Drop WAV files for this song here
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Click to browse files for {songSpec.title}. Upload
                              the remaining {getExpectedUnitLabel(songSpec)} for
                              this song here.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                          This song has reached its upload limit. Use{" "}
                          <span className="font-medium text-foreground">
                            Replace
                          </span>{" "}
                          or{" "}
                          <span className="font-medium text-foreground">
                            Remove
                          </span>{" "}
                          on an individual uploaded file below to manage tracks
                          or stems. Any replacement file is validated against
                          the same order rules.
                        </div>
                      ))}

                    <PendingSongFileList
                      pendingFiles={pendingSongFiles}
                      onRemovePendingFile={removePendingFile}
                      songSpec={songSpec}
                    />

                    {uploadState && uploadState.status !== "idle" && (
                      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {uploadState.status === "uploading" ? (
                              <Clock3 className="!h-4 !w-4 text-muted-foreground" />
                            ) : uploadState.status === "success" ? (
                              <CheckCircle2 className="!h-4 !w-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <AlertCircle className="!h-4 !w-4 text-amber-600 dark:text-amber-400" />
                            )}
                            <p className="font-medium">
                              {uploadState.message ?? "Upload in progress"}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {uploadState.progress}%
                          </p>
                        </div>
                        <Progress value={uploadState.progress} />
                        {uploadState.rejectedFiles?.length ? (
                          <div className="space-y-2">
                            {uploadState.rejectedFiles.map((file) => (
                              <div
                                key={`${file.relativePath ?? file.fileName}-${file.validationMessages.join("|")}`}
                                className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200"
                              >
                                <p className="font-medium">{file.fileName}</p>
                                <ul className="mt-2 list-disc pl-4">
                                  {file.validationMessages.map((message) => (
                                    <li key={message}>{message}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}

                    <Separator />
                    <SongAssetList
                      acceptedSourceExtensions={order.acceptedSourceExtensions}
                      isUploading={isUploading}
                      onReplaceAsset={handleAssetReplacement}
                      onRemoveAsset={handleAssetRemoval}
                      orderUploadsLocked={order.uploadsLocked}
                      replacementInputRefs={replacementInputRefs}
                      songSpec={songSpec}
                    />
                      </div>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Rules</CardTitle>
              <CardDescription>
                Source files are validated against your ordered service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                Accepted formats:{" "}
                <span className="font-medium">
                  {order.acceptedSourceExtensions.join(", ")}
                </span>
              </p>
              <p>
                Allowed bit depth:{" "}
                <span className="font-medium">24 / 32 / 64-bit</span>
              </p>
              {sampleRateRuleSummary && (
                <p>
                  {sampleRateRuleSummary.label}:{" "}
                  <span className="font-medium">
                    {sampleRateRuleSummary.value}
                  </span>
                </p>
              )}
              <p>
                Duration tolerance:{" "}
                <span className="font-medium">+/- 2 seconds</span>
              </p>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">Per-song enforced options</p>
                {perSongEnforcementNotes.map((note) => (
                  <p key={note} className="text-muted-foreground">
                    {note}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Requirements</CardTitle>
              <CardDescription>
                Captured from the service options in this order.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.requirementsSummary.length > 0 ? (
                order.requirementsSummary.map((requirement) => (
                  <Badge key={requirement} variant="secondary" className="mr-2 mb-2">
                    {requirement}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No detailed requirements are available for this order yet.
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
