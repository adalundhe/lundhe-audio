import "server-only";

import {
  AbortMultipartUploadCommand,
  type BucketLocationConstraint,
  CompleteMultipartUploadCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutBucketCorsCommand,
  S3Client,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "~/env";

const DEFAULT_PRESIGN_TTL_SECONDS = 900;
const COMPLETED_BUCKET_SUFFIX = "-completed";
const ensuredBucketCache = new Set<string>();

const sanitizeStorageSegment = (value: string) =>
  value
    .replace(/\\/g, "/")
    .replace(/[^a-zA-Z0-9/._-]+/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-|-$/g, "");

export const isOrderUploadStorageConfigured = () =>
  Boolean(env.AWS_REGION);

export const assertOrderUploadStorageConfigured = () => {
  if (!isOrderUploadStorageConfigured()) {
    throw new Error(
      "Durable order upload storage is not configured. AWS_REGION defaults to us-east-1, so provide AWS credentials through an OIDC/web identity role or the default AWS credential provider chain, or explicitly override AWS_REGION if needed.",
    );
  }
};

const getExplicitAwsCredentials = () => {
  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId && !secretAccessKey) {
    return undefined;
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Incomplete static AWS credentials. Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or remove both and rely on the default AWS credential provider chain.",
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
  };
};

let s3ClientSingleton: S3Client | null = null;

const getPresignTtlSeconds = () =>
  env.AWS_S3_PRESIGN_TTL_SECONDS ?? DEFAULT_PRESIGN_TTL_SECONDS;

export const getOrderUploadS3Client = () => {
  assertOrderUploadStorageConfigured();

  if (!s3ClientSingleton) {
    s3ClientSingleton = new S3Client({
      region: env.AWS_REGION,
      endpoint: env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE === "true",
      credentials: getExplicitAwsCredentials(),
    });
  }

  return s3ClientSingleton;
};

const normalizeCorsOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getBucketCorsAllowedOrigins = () => {
  const allowedOrigins = new Set<string>();
  const primaryOrigin = normalizeCorsOrigin(env.LUNDHE_AUDIO_DOMAIN);

  if (primaryOrigin) {
    allowedOrigins.add(primaryOrigin);
  }

  if (env.NODE_ENV !== "production") {
    [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ].forEach((origin) => allowedOrigins.add(origin));
  }

  return [...allowedOrigins];
};

const isNamedAwsError = (error: unknown, names: string[]) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const namedError = error as Error & { Code?: string; name?: string };
  return names.includes(namedError.name ?? "") || names.includes(namedError.Code ?? "");
};

export const isBucketNameConflictError = (error: unknown) =>
  isNamedAwsError(error, ["BucketAlreadyExists"]);

const applyBucketCorsConfiguration = async (bucket: string) => {
  const allowedOrigins = getBucketCorsAllowedOrigins();

  if (allowedOrigins.length === 0) {
    return;
  }

  await getOrderUploadS3Client().send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD", "PUT"],
            AllowedOrigins: allowedOrigins,
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
};

export const ensureSubmissionBucketExists = async (bucket: string) => {
  assertOrderUploadStorageConfigured();

  if (ensuredBucketCache.has(bucket)) {
    return;
  }

  const client = getOrderUploadS3Client();

  try {
    await client.send(
      new CreateBucketCommand({
        Bucket: bucket,
        ...(env.AWS_REGION === "us-east-1"
          ? {}
          : {
              CreateBucketConfiguration: {
                LocationConstraint: env.AWS_REGION as BucketLocationConstraint,
              },
            }),
      }),
    );
  } catch (error) {
    if (isNamedAwsError(error, ["BucketAlreadyOwnedByYou"])) {
      await client.send(
        new HeadBucketCommand({
          Bucket: bucket,
        }),
      );
    } else if (isNamedAwsError(error, ["OperationAborted"])) {
      await client.send(
        new HeadBucketCommand({
          Bucket: bucket,
        }),
      );
    } else {
      throw error;
    }
  }

  await applyBucketCorsConfiguration(bucket);
  ensuredBucketCache.add(bucket);
};

export const deleteSubmissionBucketIfEmpty = async (bucket: string) => {
  try {
    await getOrderUploadS3Client().send(
      new DeleteBucketCommand({
        Bucket: bucket,
      }),
    );
    ensuredBucketCache.delete(bucket);
  } catch {
    return;
  }
};

export const getStoredObjectUri = ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => `s3://${bucket}/${key}`;

export const parseStoredObjectUri = (value: string) => {
  if (!value.startsWith("s3://")) {
    return null;
  }

  const withoutProtocol = value.slice(5);
  const firstSlashIndex = withoutProtocol.indexOf("/");

  if (firstSlashIndex === -1) {
    return null;
  }

  return {
    bucket: withoutProtocol.slice(0, firstSlashIndex),
    key: withoutProtocol.slice(firstSlashIndex + 1),
  };
};

export const getOrderSongSourceObjectKey = ({
  orderId,
  submissionId,
  songSpecId,
  clientUploadId,
  fileName,
  relativePath,
}: {
  orderId: string;
  submissionId: string;
  songSpecId: string;
  clientUploadId: string;
  fileName: string;
  relativePath: string | null;
}) => {
  const slotKey = sanitizeStorageSegment(relativePath ?? fileName) || "source";
  const safeFileName = sanitizeStorageSegment(fileName) || "upload.wav";

  return `orders/${sanitizeStorageSegment(orderId)}/submissions/${sanitizeStorageSegment(
    submissionId,
  )}/songs/${sanitizeStorageSegment(songSpecId)}/source/${slotKey}/${sanitizeStorageSegment(
    clientUploadId,
  )}/${safeFileName}`;
};

export const getMultipartPartSizeBytes = (byteSize: number) => {
  const mib = 1024 * 1024;

  if (byteSize >= 1024 * mib) {
    return 64 * mib;
  }

  if (byteSize >= 256 * mib) {
    return 32 * mib;
  }

  return 16 * mib;
};

export const getMultipartPartCount = ({
  byteSize,
  partSizeBytes,
}: {
  byteSize: number;
  partSizeBytes: number;
}) => Math.max(1, Math.ceil(byteSize / partSizeBytes));

export const createPresignedPutUrl = async ({
  bucket,
  contentType,
  key,
}: {
  bucket: string;
  contentType: string;
  key: string;
}) => {
  const client = getOrderUploadS3Client();
  return await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: getPresignTtlSeconds() },
  );
};

export const createMultipartUpload = async ({
  bucket,
  contentType,
  key,
}: {
  bucket: string;
  contentType: string;
  key: string;
}) => {
  const client = getOrderUploadS3Client();
  const response = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
  );

  if (!response.UploadId) {
    throw new Error("Could not create a multipart upload for this file.");
  }

  return response.UploadId;
};

export const createMultipartPartUrls = async ({
  bucket,
  key,
  partCount,
  uploadId,
}: {
  bucket: string;
  key: string;
  partCount: number;
  uploadId: string;
}) => {
  const client = getOrderUploadS3Client();

  return await Promise.all(
    Array.from({ length: partCount }, async (_, index) => ({
      partNumber: index + 1,
      url: await getSignedUrl(
        client,
        new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          PartNumber: index + 1,
          UploadId: uploadId,
        }),
        { expiresIn: getPresignTtlSeconds() },
      ),
    })),
  );
};

export const completeMultipartUpload = async ({
  bucket,
  completedParts,
  key,
  uploadId,
}: {
  bucket: string;
  completedParts: CompletedPart[];
  key: string;
  uploadId: string;
}) => {
  const client = getOrderUploadS3Client();
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      MultipartUpload: {
        Parts: completedParts,
      },
      UploadId: uploadId,
    }),
  );
};

export const abortMultipartUpload = async ({
  bucket,
  key,
  uploadId,
}: {
  bucket: string;
  key: string;
  uploadId: string;
}) => {
  const client = getOrderUploadS3Client();
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
    }),
  );
};

export const deleteStoredObject = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  const client = getOrderUploadS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
};

export const deleteStoredObjectByUri = async (value: string) => {
  const parsed = parseStoredObjectUri(value);

  if (!parsed) {
    return false;
  }

  await deleteStoredObject(parsed);
  return true;
};

export const headStoredObject = async ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  const client = getOrderUploadS3Client();
  return await client.send(
    new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
};

export const getStoredObjectBytes = async ({
  bucket,
  key,
  range,
}: {
  bucket: string;
  key: string;
  range?: string;
}) => {
  const client = getOrderUploadS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range,
    }),
  );

  if (!response.Body) {
    throw new Error("Uploaded object could not be read back for verification.");
  }

  return Buffer.from(await response.Body.transformToByteArray());
};

export const createPresignedGetUrl = async ({
  bucket,
  expiresInSeconds,
  fileName,
  key,
}: {
  bucket: string;
  expiresInSeconds?: number;
  fileName?: string;
  key: string;
}) => {
  const client = getOrderUploadS3Client();
  const safeFileName = fileName?.replace(/["\r\n]/g, "_");

  return await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: safeFileName
        ? `attachment; filename="${safeFileName}"`
        : undefined,
    }),
    { expiresIn: expiresInSeconds ?? getPresignTtlSeconds() },
  );
};

export const buildSubmissionDownloadBucketKey = (uploadBucketKey: string) => {
  const nextBucketKey = `${uploadBucketKey}${COMPLETED_BUCKET_SUFFIX}`;

  if (nextBucketKey.length > 63) {
    throw new Error(
      "The derived completed-download bucket key exceeded the S3 bucket name limit.",
    );
  }

  return nextBucketKey;
};
