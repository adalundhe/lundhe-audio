import "server-only";

import { unlink } from "node:fs/promises";
import path from "node:path";

import { deleteStoredObjectByUri } from "~/server/storage/s3";

export const deleteOrderAssetFile = async (publicPath: string) => {
  const deletedFromObjectStorage = await deleteStoredObjectByUri(publicPath);

  if (deletedFromObjectStorage) {
    return;
  }

  if (!publicPath.startsWith("/")) {
    return;
  }

  const existingAssetPath = path.join(
    process.cwd(),
    "public",
    publicPath.replace(/^\//, ""),
  );

  await unlink(existingAssetPath).catch(() => null);
};
