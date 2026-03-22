import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getOrderDetailForUser } from "~/server/order-detail";
import { db } from "~/server/db/client";
import {
  orderArchiveDownloadSessions,
  orderSongAssets,
} from "~/server/db/schema";
import {
  createPresignedGetUrl,
  parseStoredObjectUri,
} from "~/server/storage/s3";

const TWO_HOUR_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const TWO_HOUR_SESSION_TTL_SECONDS = TWO_HOUR_SESSION_TTL_MS / 1000;
const orderArchiveStatuses = new Set(["awaiting-feedback", "completed"]);
const multipartArchivePattern = /\.(zip|z\d{2,3})$/i;

const parseJsonArray = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const getArchiveGroupKey = (fileName: string) => {
  if (/\.zip$/i.test(fileName)) {
    return fileName.replace(/\.zip$/i, "");
  }

  const multipartMatch = fileName.match(/\.z\d{2,3}$/i);
  if (multipartMatch) {
    return fileName.slice(0, -multipartMatch[0].length);
  }

  return null;
};

const getArchivePartOrder = (fileName: string) => {
  if (/\.zip$/i.test(fileName)) {
    return Number.MAX_SAFE_INTEGER;
  }

  const multipartMatch = fileName.match(/\.z(\d{2,3})$/i);
  if (multipartMatch?.[1]) {
    return Number.parseInt(multipartMatch[1], 10);
  }

  return Number.MAX_SAFE_INTEGER - 1;
};

const isSessionExpired = (expiresAt: string) =>
  new Date(expiresAt).getTime() <= Date.now();

const getArchiveAssetsForOrder = async ({
  orderId,
  userId,
}: {
  orderId: string;
  userId: string;
}) => {
  const order = await getOrderDetailForUser({
    userId,
    orderId,
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!orderArchiveStatuses.has(order.workflowStatus)) {
    throw new Error(
      "Completed file downloads are only available when the order is awaiting feedback or completed.",
    );
  }

  return order.songSpecs
    .flatMap((songSpec) => songSpec.deliverableAssets)
    .filter((asset) => multipartArchivePattern.test(asset.fileName));
};

const buildPreparedArchiveDownloads = ({
  archiveAssets,
  expiresAt,
  orderId,
  token,
}: {
  archiveAssets: Awaited<ReturnType<typeof getArchiveAssetsForOrder>>;
  expiresAt: string;
  orderId: string;
  token: string;
}) => {
  const groupedAssets = new Map<string, typeof archiveAssets>();

  for (const asset of archiveAssets) {
    const groupKey = getArchiveGroupKey(asset.fileName);

    if (!groupKey) {
      continue;
    }

    const existingGroup = groupedAssets.get(groupKey) ?? [];
    existingGroup.push(asset);
    groupedAssets.set(groupKey, existingGroup);
  }

  return {
    archives: [...groupedAssets.entries()]
      .map(([groupKey, assets]) => {
        const sortedAssets = [...assets].sort(
          (left, right) =>
            getArchivePartOrder(left.fileName) -
            getArchivePartOrder(right.fileName),
        );

        return {
          archiveId: groupKey,
          displayName: `${groupKey}.zip`,
          partCount: sortedAssets.length,
          parts: sortedAssets.map((asset) => ({
            assetId: asset.id,
            fileName: asset.fileName,
            url: `/api/account/orders/${orderId}/archive-downloads/${token}?assetId=${asset.id}`,
          })),
        };
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName)),
    expiresAt,
  };
};

const revokeActiveSessions = async ({
  orderId,
  userId,
}: {
  orderId: string;
  userId: string;
}) => {
  const now = new Date().toISOString();

  await db
    .update(orderArchiveDownloadSessions)
    .set({
      revokedAt: now,
      updated_timestamp: now,
    })
    .where(
      and(
        eq(orderArchiveDownloadSessions.orderId, orderId),
        eq(orderArchiveDownloadSessions.userId, userId),
        isNull(orderArchiveDownloadSessions.revokedAt),
      ),
    );
};

export const prepareArchiveDownloadSession = async ({
  forceRefresh = false,
  orderId,
  userId,
}: {
  forceRefresh?: boolean;
  orderId: string;
  userId: string;
}) => {
  const archiveAssets = await getArchiveAssetsForOrder({
    orderId,
    userId,
  });

  if (archiveAssets.length === 0) {
    return {
      archives: [],
      expiresAt: null,
    };
  }

  const expectedAssetIds = [...new Set(archiveAssets.map((asset) => asset.id))].sort();
  const activeSession = (
    await db
      .select()
      .from(orderArchiveDownloadSessions)
      .where(
        and(
          eq(orderArchiveDownloadSessions.orderId, orderId),
          eq(orderArchiveDownloadSessions.userId, userId),
          isNull(orderArchiveDownloadSessions.revokedAt),
        ),
      )
      .limit(1)
  ).at(0);

  if (activeSession && !isSessionExpired(activeSession.expiresAt)) {
    const activeAssetIds = parseJsonArray(activeSession.assetIds).sort();
    const sameManifest =
      activeAssetIds.length === expectedAssetIds.length &&
      activeAssetIds.every((assetId, index) => assetId === expectedAssetIds[index]);

    if (sameManifest && !forceRefresh) {
      return buildPreparedArchiveDownloads({
        archiveAssets,
        expiresAt: activeSession.expiresAt,
        orderId,
        token: activeSession.token,
      });
    }
  }

  await revokeActiveSessions({
    orderId,
    userId,
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TWO_HOUR_SESSION_TTL_MS).toISOString();
  const token = crypto.randomUUID();

  await db.insert(orderArchiveDownloadSessions).values({
    id: crypto.randomUUID(),
    orderId,
    userId,
    token,
    assetIds: JSON.stringify(expectedAssetIds),
    expiresAt,
    created_timestamp: now.toISOString(),
    updated_timestamp: now.toISOString(),
  });

  return buildPreparedArchiveDownloads({
    archiveAssets,
    expiresAt,
    orderId,
    token,
  });
};

export const resolveArchiveDownloadRedirect = async ({
  assetId,
  orderId,
  token,
  userId,
  requestUrl,
}: {
  assetId: string;
  orderId: string;
  token: string;
  userId: string;
  requestUrl: string;
}) => {
  const session = (
    await db
      .select()
      .from(orderArchiveDownloadSessions)
      .where(
        and(
          eq(orderArchiveDownloadSessions.orderId, orderId),
          eq(orderArchiveDownloadSessions.userId, userId),
          eq(orderArchiveDownloadSessions.token, token),
        ),
      )
      .limit(1)
  ).at(0);

  if (!session || session.revokedAt) {
    throw new Error("This download link is no longer active.");
  }

  if (isSessionExpired(session.expiresAt)) {
    throw new Error("This download link has expired. Generate a new one.");
  }

  const sessionAssetIds = parseJsonArray(session.assetIds);
  if (!sessionAssetIds.includes(assetId)) {
    throw new Error("The requested archive part is not part of this download.");
  }

  const asset = (
    await db
      .select()
      .from(orderSongAssets)
      .where(
        and(
          eq(orderSongAssets.id, assetId),
          eq(orderSongAssets.orderId, orderId),
          eq(orderSongAssets.assetKind, "deliverable"),
        ),
      )
      .limit(1)
  ).at(0);

  if (!asset) {
    throw new Error("The requested archive part was not found.");
  }

  const parsedStorageUri = parseStoredObjectUri(asset.publicPath);
  if (!parsedStorageUri) {
    return new URL(asset.publicPath, requestUrl).toString();
  }

  return await createPresignedGetUrl({
    bucket: parsedStorageUri.bucket,
    expiresInSeconds: TWO_HOUR_SESSION_TTL_SECONDS,
    key: parsedStorageUri.key,
    fileName: asset.fileName,
  });
};
