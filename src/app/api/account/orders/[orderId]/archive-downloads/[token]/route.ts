import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { resolveArchiveDownloadRedirect } from "~/server/order-archive-downloads";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ orderId: string; token: string }>;
  },
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { orderId, token } = await params;
  const assetId = new URL(request.url).searchParams.get("assetId");

  if (!assetId) {
    return NextResponse.json(
      { message: "Missing archive asset id." },
      { status: 400 },
    );
  }

  try {
    const redirectUrl = await resolveArchiveDownloadRedirect({
      assetId,
      orderId,
      token,
      userId,
      requestUrl: request.url,
    });

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The download link could not be prepared.";
    const status = message.includes("expired")
      ? 410
      : message.includes("Unauthorized")
        ? 401
        : 400;

    return NextResponse.json({ message }, { status });
  }
}
