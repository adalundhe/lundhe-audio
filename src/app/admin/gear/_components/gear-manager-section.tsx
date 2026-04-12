import { unstable_noStore as noStore } from "next/cache";
import { AlertTriangle } from "lucide-react";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

import { GearManager } from "./gear-manager";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Unable to load the gear manager right now.";
};

export async function GearManagerSection() {
  noStore();

  try {
    const trpc = createCaller(await createTRPCContext({ req: {} }));
    const [gearResult, wishlistResult] = await Promise.allSettled([
      trpc.adminGear.list(),
      trpc.adminGear.listWishlist(),
    ]);

    if (gearResult.status !== "fulfilled") {
      throw gearResult.reason;
    }

    return (
      <GearManager
        initialGear={gearResult.value}
        initialWishlist={
          wishlistResult.status === "fulfilled" ? wishlistResult.value : []
        }
        wishlistLoadError={
          wishlistResult.status === "rejected"
            ? getErrorMessage(wishlistResult.reason)
            : null
        }
      />
    );
  } catch (error) {
    return (
      <Card className="min-w-0 border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="!h-[16px] !w-[16px]" />
            Gear Manager Unavailable
          </CardTitle>
          <CardDescription>
            The page shell is still available, but the gear tools could not be
            loaded from the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            {getErrorMessage(error)}
          </div>
        </CardContent>
      </Card>
    );
  }
}
