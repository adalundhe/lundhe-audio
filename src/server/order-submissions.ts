import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "~/server/db/client";
import { orderSubmissions } from "~/server/db/schema";
import {
  buildSubmissionDownloadBucketKey,
  deleteSubmissionBucketIfEmpty,
  ensureSubmissionBucketExists,
  isBucketNameConflictError,
} from "~/server/storage/s3";

const BUCKET_NAME_MAX_LENGTH = 63;
const COMPLETED_BUCKET_SUFFIX_LENGTH = "-completed".length;
const SUBMISSION_BUCKET_ATTEMPT_LIMIT = 1000;
const sessionSongCountPattern = /\((\d+)\s+song(?:s)?\)\s*$/i;

const isMissingSubmissionSchemaError = (error: unknown) =>
  error instanceof Error && error.message.includes("no such table: submissions");

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Error && error.message.includes("UNIQUE constraint failed");

const sanitizeBucketSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const stripServiceMetadata = (value: string) =>
  value.replace(sessionSongCountPattern, "").trim();

const formatBucketTimestamp = (submittedAt: string) => {
  const date = new Date(submittedAt);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");
  const seconds = `${date.getUTCSeconds()}`.padStart(2, "0");
  const milliseconds = `${date.getUTCMilliseconds()}`.padStart(3, "0");

  return `${year}${month}${day}t${hours}${minutes}${seconds}${milliseconds}z`;
};

const fitBucketSegments = ({
  projectSlug,
  timestampSegment,
  userSlug,
}: {
  projectSlug: string;
  timestampSegment: string;
  userSlug: string;
}) => {
  const reservedLength = timestampSegment.length + COMPLETED_BUCKET_SUFFIX_LENGTH + 2;
  const availableCombinedLength = BUCKET_NAME_MAX_LENGTH - reservedLength;

  if (availableCombinedLength < 2) {
    throw new Error("The derived submission bucket key exceeded the S3 bucket name limit.");
  }

  let nextUserLength = Math.min(
    userSlug.length,
    Math.max(1, Math.ceil(availableCombinedLength / 2)),
  );
  let nextProjectLength = Math.min(
    projectSlug.length,
    Math.max(1, availableCombinedLength - nextUserLength),
  );

  let remainingLength = availableCombinedLength - nextUserLength - nextProjectLength;

  if (remainingLength > 0 && userSlug.length > nextUserLength) {
    const extraUserLength = Math.min(
      userSlug.length - nextUserLength,
      remainingLength,
    );
    nextUserLength += extraUserLength;
    remainingLength -= extraUserLength;
  }

  if (remainingLength > 0 && projectSlug.length > nextProjectLength) {
    const extraProjectLength = Math.min(
      projectSlug.length - nextProjectLength,
      remainingLength,
    );
    nextProjectLength += extraProjectLength;
    remainingLength -= extraProjectLength;
  }

  const trimmedUserSlug =
    sanitizeBucketSegment(userSlug.slice(0, nextUserLength)) || "user";
  const trimmedProjectSlug =
    sanitizeBucketSegment(projectSlug.slice(0, nextProjectLength)) || "project";

  return {
    projectSlug: trimmedProjectSlug,
    userSlug: trimmedUserSlug,
  };
};

export const getOrderProjectName = (orderItemNames: string[]) => {
  const projectName = [
    ...new Set(
      orderItemNames
        .map((value) => stripServiceMetadata(value))
        .filter((value) => value.length > 0),
    ),
  ].join(" / ");

  return projectName || "Studio Session";
};

export const buildOrderSubmissionUploadBucketKey = ({
  projectName,
  submittedAt,
  userDisplayName,
}: {
  projectName: string;
  submittedAt: string;
  userDisplayName: string;
}) => {
  const timestampSegment = formatBucketTimestamp(submittedAt);
  const { projectSlug, userSlug } = fitBucketSegments({
    projectSlug: sanitizeBucketSegment(projectName) || "project",
    timestampSegment,
    userSlug: sanitizeBucketSegment(userDisplayName) || "user",
  });

  return `${userSlug}-${projectSlug}-${timestampSegment}`;
};

export const getOrderSubmissionForUser = async ({
  orderId,
  submissionId,
  userId,
}: {
  orderId: string;
  submissionId: string;
  userId: string;
}) => {
  try {
    return (
      await db
        .select()
        .from(orderSubmissions)
        .where(
          and(
            eq(orderSubmissions.id, submissionId),
            eq(orderSubmissions.orderId, orderId),
            eq(orderSubmissions.userId, userId),
          ),
        )
        .limit(1)
    ).at(0) ?? null;
  } catch (error) {
    if (isMissingSubmissionSchemaError(error)) {
      throw new Error(
        "Order submissions are unavailable until the latest database migration has been applied.",
      );
    }

    throw error;
  }
};

export const getLatestOrderSubmissionForUser = async ({
  orderId,
  userId,
}: {
  orderId: string;
  userId: string;
}) => {
  try {
    return (
      await db
        .select()
        .from(orderSubmissions)
        .where(
          and(
            eq(orderSubmissions.orderId, orderId),
            eq(orderSubmissions.userId, userId),
          ),
        )
        .orderBy(desc(orderSubmissions.submittedAt))
        .limit(1)
    ).at(0) ?? null;
  } catch (error) {
    if (isMissingSubmissionSchemaError(error)) {
      return null;
    }

    throw error;
  }
};

export const createOrderSubmission = async ({
  orderId,
  projectName,
  userDisplayName,
  userId,
}: {
  orderId: string;
  projectName: string;
  userDisplayName: string;
  userId: string;
}) => {
  const baseTimestampMs = Date.now();

  for (
    let attemptIndex = 0;
    attemptIndex < SUBMISSION_BUCKET_ATTEMPT_LIMIT;
    attemptIndex += 1
  ) {
    const submittedAt = new Date(baseTimestampMs + attemptIndex).toISOString();
    const uploadBucketKey = buildOrderSubmissionUploadBucketKey({
      projectName,
      submittedAt,
      userDisplayName,
    });
    const nextSubmission = {
      id: crypto.randomUUID(),
      orderId,
      userId,
      uploadBucketKey,
      downloadBucketKey: null,
      submittedAt,
      created_timestamp: submittedAt,
      updated_timestamp: submittedAt,
    } as const;

    try {
      await db.insert(orderSubmissions).values(nextSubmission);
    } catch (error) {
      if (isMissingSubmissionSchemaError(error)) {
        throw new Error(
          "Order submissions are unavailable until the latest database migration has been applied.",
        );
      }

      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }

    try {
      await ensureSubmissionBucketExists(uploadBucketKey);
      return nextSubmission;
    } catch (error) {
      await db
        .delete(orderSubmissions)
        .where(eq(orderSubmissions.id, nextSubmission.id))
        .catch(() => null);
      await deleteSubmissionBucketIfEmpty(uploadBucketKey);

      if (isBucketNameConflictError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "A unique submission bucket could not be created for this order. Try submitting again.",
  );
};

export const ensureSubmissionDownloadBucket = async ({
  submissionId,
}: {
  submissionId: string;
}) => {
  const submission = (
    await db
      .select()
      .from(orderSubmissions)
      .where(eq(orderSubmissions.id, submissionId))
      .limit(1)
  ).at(0);

  if (!submission) {
    throw new Error("The submission could not be found.");
  }

  if (submission.downloadBucketKey) {
    return submission;
  }

  const downloadBucketKey = buildSubmissionDownloadBucketKey(
    submission.uploadBucketKey,
  );

  await ensureSubmissionBucketExists(downloadBucketKey);

  const updatedAt = new Date().toISOString();
  await db
    .update(orderSubmissions)
    .set({
      downloadBucketKey,
      updated_timestamp: updatedAt,
    })
    .where(eq(orderSubmissions.id, submissionId));

  return {
    ...submission,
    downloadBucketKey,
    updated_timestamp: updatedAt,
  };
};
