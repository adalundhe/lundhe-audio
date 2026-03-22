"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { parseAudioMetadata, type ParsedAudioMetadata } from "~/lib/audio/wav-metadata";
import {
  getNormalizedUploadKey,
  isAcceptedSourceFileName,
  validateSongFileMetadata,
} from "~/lib/orders/upload-validation";
import { deleteOrderAssetFile } from "~/server/order-asset-storage";
import { db } from "~/server/db/client";
import { orderSongAssets } from "~/server/db/schema";
import {
  createOrderSubmission,
  getOrderProjectName,
  getOrderSubmissionForUser,
} from "~/server/order-submissions";
import {
  getOrderDetailForUser,
  syncOrderWorkflowFromUploads,
} from "~/server/order-detail";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  createMultipartPartUrls,
  createMultipartUpload,
  createPresignedPutUrl,
  getMultipartPartCount,
  getMultipartPartSizeBytes,
  getOrderSongSourceObjectKey,
  getStoredObjectBytes,
  getStoredObjectUri,
  headStoredObject,
} from "~/server/storage/s3";
import type { OrderSongAsset, OrderSongSpec } from "~/types/orders";

const MULTIPART_THRESHOLD_BYTES = 64 * 1024 * 1024;
const WAVE_HEADER_RANGE = "bytes=0-1048575";

type PreparedOrderUploadClientMetadata = ParsedAudioMetadata;

export interface PreparedOrderUploadInput {
  clientUploadId: string;
  songSpecId: string;
  fileName: string;
  relativePath: string | null;
  byteSize: number;
  mimeType: string | null;
  replaceAssetId: string | null;
  clientMetadata: PreparedOrderUploadClientMetadata;
}

export interface PreparedSinglePartUpload {
  clientUploadId: string;
  kind: "single-part";
  submissionId: string;
  songSpecId: string;
  objectKey: string;
  uploadUrl: string;
  contentType: string;
}

export interface PreparedMultipartUpload {
  clientUploadId: string;
  kind: "multipart";
  submissionId: string;
  songSpecId: string;
  objectKey: string;
  uploadId: string;
  contentType: string;
  partSizeBytes: number;
  parts: {
    partNumber: number;
    url: string;
  }[];
}

export type PreparedOrderUpload =
  | PreparedSinglePartUpload
  | PreparedMultipartUpload;

export interface CompletePreparedOrderUploadInput {
  clientUploadId: string;
  submissionId: string;
  songSpecId: string;
  fileName: string;
  relativePath: string | null;
  byteSize: number;
  mimeType: string | null;
  replaceAssetId: string | null;
  objectKey: string;
  uploadKind: PreparedOrderUpload["kind"];
  uploadId?: string | null;
  completedParts?: {
    partNumber: number;
    eTag: string;
  }[];
}

const getAssetKey = (asset: Pick<OrderSongAsset, "originalRelativePath" | "fileName">) =>
  asset.originalRelativePath ?? asset.fileName;

const getContentType = (mimeType: string | null) => {
  if (mimeType?.trim()) {
    return mimeType;
  }

  return "audio/wav";
};

const getUserDisplayName = async (userId: string) => {
  const user = await currentUser();
  const fullName =
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

  return (
    fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    userId
  );
};

const getSongSpecMap = (songSpecs: OrderSongSpec[]) =>
  new Map(songSpecs.map((songSpec) => [songSpec.id, songSpec]));

const getSourceCountErrorMessage = (songSpec: OrderSongSpec) => {
  const expectedCount = songSpec.expectedSourceCount ?? 0;
  const unitLabel =
    songSpec.sourceType === "mixing-tracks"
      ? "track"
      : songSpec.sourceType === "mastering-stems"
        ? "stem"
        : "source file";

  return `This song allows up to ${expectedCount} ${unitLabel}${expectedCount === 1 ? "" : "s"}. Replace an existing upload or reduce this batch.`;
};

const validatePreparedFile = ({
  file,
  songSpec,
}: {
  file: PreparedOrderUploadInput;
  songSpec: OrderSongSpec;
}) => {
  const validationMessages: string[] = [];

  if (!isAcceptedSourceFileName(file.fileName)) {
    validationMessages.push(
      "Unsupported source format. Upload WAV/WAVE files only.",
    );
  }

  validationMessages.push(
    ...validateSongFileMetadata({
      metadata: file.clientMetadata,
      songSpec,
    }),
  );

  return validationMessages;
};

const assertPreparedFilesAgainstOrder = ({
  files,
  order,
}: {
  files: PreparedOrderUploadInput[];
  order: NonNullable<Awaited<ReturnType<typeof getOrderDetailForUser>>>;
}) => {
  const songSpecsById = getSongSpecMap(order.songSpecs);
  const duplicateFileKeys = new Set<string>();
  const seenFileKeys = new Set<string>();

  for (const file of files) {
    const duplicateKey = `${file.songSpecId}:${getNormalizedUploadKey(file)}`;

    if (seenFileKeys.has(duplicateKey)) {
      duplicateFileKeys.add(duplicateKey);
    }

    seenFileKeys.add(duplicateKey);
  }

  if (duplicateFileKeys.size > 0) {
    throw new Error(
      "This submission contains duplicate file paths for the same song. Remove duplicates and try again.",
    );
  }

  const filesBySongId = files.reduce<Record<string, PreparedOrderUploadInput[]>>(
    (grouped, file) => {
      grouped[file.songSpecId] ??= [];
      grouped[file.songSpecId]?.push(file);
      return grouped;
    },
    {},
  );

  for (const [songSpecId, songFiles] of Object.entries(filesBySongId)) {
    const songSpec = songSpecsById.get(songSpecId);

    if (!songSpec) {
      throw new Error("One or more selected songs are no longer available.");
    }

    const replacementIds = new Set<string>();

    for (const file of songFiles) {
      const validationMessages = validatePreparedFile({
        file,
        songSpec,
      });

      if (validationMessages.length > 0) {
        throw new Error(
          `${file.fileName}: ${validationMessages.join(" ")}`,
        );
      }

      if (file.replaceAssetId) {
        const existingAsset = songSpec.sourceAssets.find(
          (asset) => asset.id === file.replaceAssetId,
        );

        if (!existingAsset) {
          throw new Error(
            `The source file being replaced for ${songSpec.title} was not found.`,
          );
        }

        if (replacementIds.has(file.replaceAssetId)) {
          throw new Error(
            `Only one replacement can target the same uploaded file in ${songSpec.title}.`,
          );
        }

        replacementIds.add(file.replaceAssetId);
      }
    }

    if (songSpec.expectedSourceCount !== null) {
      const resultingCount =
        songSpec.sourceAssets.length - replacementIds.size + songFiles.length;

      if (resultingCount > songSpec.expectedSourceCount) {
        throw new Error(getSourceCountErrorMessage(songSpec));
      }
    }
  }
};

export async function prepareOrderUploadSubmission({
  files,
  orderId,
}: {
  orderId: string;
  files: PreparedOrderUploadInput[];
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized.");
  }

  if (files.length === 0) {
    throw new Error("Select at least one file to submit.");
  }

  const order = await getOrderDetailForUser({
    userId,
    orderId,
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.uploadsLocked) {
    throw new Error(
      "Uploads are locked because this project has already moved into production.",
    );
  }

  assertPreparedFilesAgainstOrder({
    files,
    order,
  });

  const submission = await createOrderSubmission({
    orderId,
    projectName: getOrderProjectName(order.items.map((item) => item.name)),
    userDisplayName: await getUserDisplayName(userId),
    userId,
  });
  const bucket = submission.uploadBucketKey;

  return await Promise.all(
    files.map(async (file) => {
      const contentType = getContentType(file.mimeType);
      const objectKey = getOrderSongSourceObjectKey({
        orderId,
        submissionId: submission.id,
        songSpecId: file.songSpecId,
        clientUploadId: file.clientUploadId,
        fileName: file.fileName,
        relativePath: file.relativePath,
      });

      if (file.byteSize < MULTIPART_THRESHOLD_BYTES) {
        return {
          clientUploadId: file.clientUploadId,
          kind: "single-part",
          submissionId: submission.id,
          songSpecId: file.songSpecId,
          objectKey,
          uploadUrl: await createPresignedPutUrl({
            bucket,
            contentType,
            key: objectKey,
          }),
          contentType,
        } satisfies PreparedSinglePartUpload;
      }

      const partSizeBytes = getMultipartPartSizeBytes(file.byteSize);
      const partCount = getMultipartPartCount({
        byteSize: file.byteSize,
        partSizeBytes,
      });
      const uploadId = await createMultipartUpload({
        bucket,
        contentType,
        key: objectKey,
      });

      return {
        clientUploadId: file.clientUploadId,
        kind: "multipart",
        submissionId: submission.id,
        songSpecId: file.songSpecId,
        objectKey,
        uploadId,
        contentType,
        partSizeBytes,
        parts: await createMultipartPartUrls({
          bucket,
          key: objectKey,
          partCount,
          uploadId,
        }),
      } satisfies PreparedMultipartUpload;
    }),
  );
}

const validateUploadedObjectAgainstSongSpec = async ({
  bucket,
  fileName,
  key,
  songSpec,
}: {
  bucket: string;
  fileName: string;
  key: string;
  songSpec: OrderSongSpec;
}) => {
  const [headResponse, headerBytes] = await Promise.all([
    headStoredObject({
      bucket,
      key,
    }),
    getStoredObjectBytes({
      bucket,
      key,
      range: WAVE_HEADER_RANGE,
    }),
  ]);

  const objectSize = headResponse.ContentLength;

  if (!objectSize || objectSize <= 0) {
    throw new Error("The uploaded file could not be verified.");
  }

  const metadata = parseAudioMetadata(fileName, headerBytes);
  const validationMessages = validateSongFileMetadata({
    metadata,
    songSpec,
  });

  if (validationMessages.length > 0) {
    throw new Error(validationMessages.join(" "));
  }

  return {
    byteSize: objectSize,
    metadata,
    mimeType: headResponse.ContentType || null,
  };
};

export async function completePreparedOrderUpload({
  file,
  orderId,
}: {
  orderId: string;
  file: CompletePreparedOrderUploadInput;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized.");
  }

  const order = await getOrderDetailForUser({
    userId,
    orderId,
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.uploadsLocked) {
    throw new Error(
      "Uploads are locked because this project has already moved into production.",
    );
  }

  const songSpec = order.songSpecs.find(
    (candidateSongSpec) => candidateSongSpec.id === file.songSpecId,
  );

  if (!songSpec) {
    throw new Error("The selected song could not be found.");
  }

  const submission = await getOrderSubmissionForUser({
    orderId,
    submissionId: file.submissionId,
    userId,
  });

  if (!submission) {
    throw new Error("The upload submission for this file could not be found.");
  }

  const bucket = submission.uploadBucketKey;

  try {
    if (file.uploadKind === "multipart") {
      if (!file.uploadId || !file.completedParts?.length) {
        throw new Error(
          "Multipart uploads must include the upload id and completed parts.",
        );
      }

      await completeMultipartUpload({
        bucket,
        completedParts: file.completedParts
          .sort((left, right) => left.partNumber - right.partNumber)
          .map((part) => ({
            ETag: part.eTag,
            PartNumber: part.partNumber,
          })),
        key: file.objectKey,
        uploadId: file.uploadId,
      });
    }

    const verifiedUpload = await validateUploadedObjectAgainstSongSpec({
      bucket,
      fileName: file.fileName,
      key: file.objectKey,
      songSpec,
    });

    if (verifiedUpload.byteSize !== file.byteSize) {
      throw new Error(
        "The uploaded file size did not match the prepared submission.",
      );
    }

    const explicitReplacementAsset = file.replaceAssetId
      ? songSpec.sourceAssets.find((asset) => asset.id === file.replaceAssetId) ??
        null
      : null;
    const implicitReplacementAsset = songSpec.sourceAssets.find(
      (asset) =>
        asset.id !== explicitReplacementAsset?.id &&
        getAssetKey(asset) ===
          getNormalizedUploadKey({
            fileName: file.fileName,
            relativePath: file.relativePath,
          }),
    );
    const assetToReplace =
      explicitReplacementAsset ?? implicitReplacementAsset ?? null;

    if (file.replaceAssetId && !explicitReplacementAsset) {
      throw new Error("The source file being replaced was not found.");
    }

    if (assetToReplace) {
      await db
        .delete(orderSongAssets)
        .where(
          and(
            eq(orderSongAssets.id, assetToReplace.id),
            eq(orderSongAssets.orderId, orderId),
          ),
        );

      await deleteOrderAssetFile(assetToReplace.publicPath);
    }

    const storageUri = getStoredObjectUri({
      bucket,
      key: file.objectKey,
    });
    const incomingKey = getNormalizedUploadKey({
      fileName: file.fileName,
      relativePath: file.relativePath,
    });

    await db.insert(orderSongAssets).values({
      id: crypto.randomUUID(),
      orderId,
      songSpecId: songSpec.id,
      assetKind: "source",
      validationStatus: "valid",
      fileName: file.fileName,
      originalRelativePath:
        file.relativePath ??
        explicitReplacementAsset?.originalRelativePath ??
        null,
      publicPath: storageUri,
      mimeType: file.mimeType ?? verifiedUpload.mimeType,
      byteSize: verifiedUpload.byteSize,
      durationSeconds: verifiedUpload.metadata.durationSeconds,
      sampleRateHz: verifiedUpload.metadata.sampleRateHz,
      bitDepth: verifiedUpload.metadata.bitDepth,
      channelCount: verifiedUpload.metadata.channelCount,
      validationMessages: JSON.stringify([]),
      uploaded_timestamp: new Date().toISOString(),
      created_timestamp: new Date().toISOString(),
      updated_timestamp: new Date().toISOString(),
    });

    await syncOrderWorkflowFromUploads(orderId);
    revalidatePath(`/account/orders/${orderId}`);

    return {
      clientUploadId: file.clientUploadId,
      fileName: file.fileName,
      message:
        assetToReplace && getAssetKey(assetToReplace) === incomingKey
          ? "File replaced successfully."
          : "Files uploaded successfully.",
    };
  } catch (error) {
    if (file.uploadKind === "multipart" && file.uploadId) {
      await abortMultipartUpload({
        bucket,
        key: file.objectKey,
        uploadId: file.uploadId,
      }).catch(() => null);
    }

    await deleteOrderAssetFile(
      getStoredObjectUri({
        bucket,
        key: file.objectKey,
      }),
    ).catch(() => null);

    throw error;
  }
}
