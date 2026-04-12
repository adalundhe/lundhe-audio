import { unstable_noStore as noStore } from "next/cache";

import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

import { GearManager } from "./_components/gear-manager";

export const dynamic = "force-dynamic";

export default async function AdminGearPage() {
  noStore();

  const trpc = createCaller(await createTRPCContext({ req: {} }));
  const gear = await trpc.adminGear.list();

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-6 px-4 sm:px-6">
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-semibold">Manage Gear</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Add a new piece of equipment, or click any row to edit it.
        </p>
      </div>

      <GearManager initialGear={gear} />
    </div>
  );
}
