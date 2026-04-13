import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import { GearManagerBoundary } from "./_components/gear-manager-boundary";
import { GearManagerLoading } from "./_components/gear-manager-loading";
import { GearManagerSection } from "./_components/gear-manager-section";

export const dynamic = "force-dynamic";

export default function AdminGearPage() {
  noStore();

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-2">
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-semibold">Manage Gear</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Add a new piece of equipment, or click any row to edit it.
        </p>
      </div>

      <GearManagerBoundary>
        <Suspense fallback={<GearManagerLoading />}>
          <GearManagerSection />
        </Suspense>
      </GearManagerBoundary>
    </div>
  );
}
