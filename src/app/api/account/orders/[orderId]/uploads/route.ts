import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { deleteOrderAssetFile } from "~/server/order-asset-storage";
import { db } from "~/server/db/client";
import { orderSongAssets } from "~/server/db/schema";
import {
  getOrderSongSpecForUser,
  syncOrderWorkflowFromUploads,
} from "~/server/order-detail";

export const runtime = "nodejs";

const usesCappedSourceCount = (sourceType: string) =>
  sourceType === "mixing-tracks" || sourceType === "mastering-stems";

const getMinimumRequiredSourceCount = (songSpec: {
  sourceType: string;
  expectedSourceCount: number | null;
}) =>
  usesCappedSourceCount(songSpec.sourceType)
    ? 1
    : (songSpec.expectedSourceCount ?? 1);

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Source file bodies are no longer uploaded through the Next.js app server. Use the order submission flow instead.",
    },
    { status: 410 },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;
  const body = (await request.json().catch(() => null)) as
    | {
        songSpecId?: string;
        assetId?: string;
      }
    | null;
  const songSpecId = body?.songSpecId;
  const assetId = body?.assetId;

  if (!songSpecId || !assetId) {
    return NextResponse.json(
      { message: "Missing song or asset id for removal." },
      { status: 400 },
    );
  }

  const orderSong = await getOrderSongSpecForUser({
    userId,
    orderId,
    songSpecId,
  });

  if (!orderSong) {
    return NextResponse.json(
      { message: "Order song was not found." },
      { status: 404 },
    );
  }

  if (orderSong.uploadsLocked) {
    return NextResponse.json(
      {
        message:
          "Uploads are locked because this project has already moved into production.",
      },
      { status: 409 },
    );
  }

  const asset = orderSong.songSpec.sourceAssets.find(
    (sourceAsset) => sourceAsset.id === assetId,
  );

  if (!asset) {
    return NextResponse.json(
      { message: "The source file you are trying to remove was not found." },
      { status: 404 },
    );
  }

  const remainingValidCount = Math.max(
    orderSong.songSpec.sourceAssets.length - 1,
    0,
  );
  const minimumRequiredCount = getMinimumRequiredSourceCount(orderSong.songSpec);

  if (
    orderSong.songSpec.sourceAssets.length > 1 &&
    remainingValidCount < minimumRequiredCount
  ) {
    return NextResponse.json(
      {
        message:
          "At least one validated source file must remain for this song. Replace the existing file instead if you need to swap it out.",
      },
      { status: 400 },
    );
  }

  await db
    .delete(orderSongAssets)
    .where(
      and(
        eq(orderSongAssets.id, asset.id),
        eq(orderSongAssets.orderId, orderId),
      ),
    );

  await deleteOrderAssetFile(asset.publicPath);

  await syncOrderWorkflowFromUploads(orderId);
  revalidatePath(`/account/orders/${orderId}`);

  return NextResponse.json({
    message: "File removed successfully.",
  });
}
