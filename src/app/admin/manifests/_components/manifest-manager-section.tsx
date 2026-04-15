import { unstable_noStore as noStore } from "next/cache";
import { AlertTriangle } from "lucide-react";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { ManifestManager } from "./manifest-manager";

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Unable to load the manifest manager right now.";
};

export async function ManifestManagerSection() {
  noStore();

  try {
    const trpc = createCaller(await createTRPCContext({ req: {} }));
    const [gear, manifests] = await Promise.all([
      trpc.adminGear.list(),
      trpc.adminManifests.list(),
    ]);

    return <ManifestManager initialGear={gear} initialManifests={manifests} />;
  } catch (error) {
    return (
      <div className="min-w-0 border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="!h-[16px] !w-[16px]" />
            Manifest Manager Unavailable
          </CardTitle>
          <CardDescription>
            The page shell is still available, but the manifest tools could not be
            loaded from the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            {getErrorMessage(error)}
          </div>
        </CardContent>
      </div>
    );
  }
}
