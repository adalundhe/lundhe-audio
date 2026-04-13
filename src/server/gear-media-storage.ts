import "server-only";

import { env } from "~/env";
import {
  createMultipartPartUrls,
  createMultipartUpload,
  getMultipartPartCount,
  getMultipartPartSizeBytes,
} from "~/server/storage/s3";

export const gearMediaBucketName = env.GEAR_MEDIA_BUCKET_NAME;

const slugifySegment = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const getFileExtension = (fileName: string) => {
  const trimmedFileName = fileName.trim();
  const lastDotIndex = trimmedFileName.lastIndexOf(".");

  if (lastDotIndex === -1 || lastDotIndex === trimmedFileName.length - 1) {
    return "";
  }

  return trimmedFileName.slice(lastDotIndex + 1).toLocaleLowerCase();
};

export const inferGearMediaAssetType = ({
  contentType,
  fileName,
}: {
  contentType: string;
  fileName: string;
}) => {
  const normalizedContentType = contentType.trim().toLocaleLowerCase();
  const extension = getFileExtension(fileName);

  if (
    normalizedContentType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "heic", "avif"].includes(
      extension,
    )
  ) {
    return "photo" as const;
  }

  return "document" as const;
};

export const buildGearMediaObjectKey = ({
  equipmentItemId,
  manufacturer,
  name,
  mediaId,
  fileName,
}: {
  equipmentItemId: string;
  manufacturer: string;
  name: string;
  mediaId: string;
  fileName: string;
}) => {
  const slugBase = [
    manufacturer,
    name,
    equipmentItemId,
    mediaId,
  ]
    .map(slugifySegment)
    .filter(Boolean)
    .join("-");
  const extension = getFileExtension(fileName);
  const safeFileName = extension ? `${slugBase}.${extension}` : slugBase;

  return `gear/${slugifySegment(equipmentItemId)}/${safeFileName}`;
};

export const prepareGearMediaMultipartUpload = async ({
  byteSize,
  contentType,
  equipmentItemId,
  fileName,
  manufacturer,
  mediaId,
  name,
}: {
  byteSize: number;
  contentType: string;
  equipmentItemId: string;
  fileName: string;
  manufacturer: string;
  mediaId: string;
  name: string;
}) => {
  const objectKey = buildGearMediaObjectKey({
    equipmentItemId,
    manufacturer,
    name,
    mediaId,
    fileName,
  });
  const partSizeBytes = getMultipartPartSizeBytes(byteSize);
  const partCount = getMultipartPartCount({
    byteSize,
    partSizeBytes,
  });
  const uploadId = await createMultipartUpload({
    bucket: gearMediaBucketName,
    contentType,
    key: objectKey,
  });
  const parts = await createMultipartPartUrls({
    bucket: gearMediaBucketName,
    key: objectKey,
    partCount,
    uploadId,
  });

  return {
    bucket: gearMediaBucketName,
    objectKey,
    partSizeBytes,
    parts,
    uploadId,
  };
};
