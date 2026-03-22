"use server";

import { auth } from "@clerk/nextjs/server";

import { prepareArchiveDownloadSession } from "~/server/order-archive-downloads";

export type PreparedOrderArchiveDownload = {
  archiveId: string;
  displayName: string;
  partCount: number;
  parts: {
    assetId: string;
    fileName: string;
    url: string;
  }[];
};

export type PreparedOrderArchiveDownloadResponse = {
  archives: PreparedOrderArchiveDownload[];
  expiresAt: string | null;
};

export async function prepareOrderArchiveDownloads({
  forceRefresh = false,
  orderId,
}: {
  forceRefresh?: boolean;
  orderId: string;
}): Promise<PreparedOrderArchiveDownloadResponse> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("You must be signed in to download completed files.");
  }

  return await prepareArchiveDownloadSession({
    forceRefresh,
    orderId,
    userId,
  });
}
