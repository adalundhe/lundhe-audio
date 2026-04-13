import { eq } from "drizzle-orm";

import { db } from "~/server/db/client";
import { equipmentItemMediaAsset } from "~/server/db/schema";
import { parseStoredObjectUri, getStoredObjectBytes } from "~/server/storage/s3";

const sanitizeHeaderFileName = (value: string) =>
  value.replace(/["\r\n]/g, "_");

const parseByteRange = ({
  range,
  totalBytes,
}: {
  range: string;
  totalBytes: number;
}) => {
  const match = range.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match) {
    return null;
  }

  const rawStart = match[1];
  const rawEnd = match[2];

  if (rawStart === "" && rawEnd === "") {
    return null;
  }

  if (rawStart === "") {
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }

    const start = Math.max(totalBytes - suffixLength, 0);
    return {
      start,
      end: totalBytes - 1,
    };
  }

  const start = Number(rawStart);
  const requestedEnd = rawEnd === "" ? totalBytes - 1 : Number(rawEnd);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(requestedEnd) ||
    start < 0 ||
    requestedEnd < start
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(requestedEnd, totalBytes - 1),
  };
};

const getAsset = async (mediaId: string) =>
  await db
    .select()
    .from(equipmentItemMediaAsset)
    .where(eq(equipmentItemMediaAsset.id, mediaId))
    .get();

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  const asset = await getAsset(mediaId);

  if (!asset) {
    return new Response("Not found.", { status: 404 });
  }

  return new Response(null, {
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(asset.byteSize),
      "Content-Type": asset.contentType,
      "Content-Disposition": `inline; filename="${sanitizeHeaderFileName(asset.fileName)}"`,
    },
    status: 200,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ mediaId: string }> },
) {
  const { mediaId } = await context.params;
  const asset = await getAsset(mediaId);

  if (!asset) {
    return new Response("Not found.", { status: 404 });
  }

  const parsedStorageUri = parseStoredObjectUri(asset.storageUri);
  if (!parsedStorageUri) {
    return new Response("Invalid storage URI.", { status: 500 });
  }

  const rangeHeader = request.headers.get("range");
  const range = rangeHeader
    ? parseByteRange({ range: rangeHeader, totalBytes: asset.byteSize })
    : null;

  if (rangeHeader && !range) {
    return new Response("Requested range not satisfiable.", {
      headers: {
        "Content-Range": `bytes */${asset.byteSize}`,
      },
      status: 416,
    });
  }

  const bytes = await getStoredObjectBytes({
    bucket: parsedStorageUri.bucket,
    key: parsedStorageUri.key,
    range: range ? `bytes=${range.start}-${range.end}` : undefined,
  });

  return new Response(bytes, {
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Disposition": `inline; filename="${sanitizeHeaderFileName(asset.fileName)}"`,
      "Content-Length": String(bytes.byteLength),
      "Content-Type": asset.contentType,
      ...(range
        ? {
            "Content-Range": `bytes ${range.start}-${range.end}/${asset.byteSize}`,
          }
        : {}),
    },
    status: range ? 206 : 200,
  });
}
