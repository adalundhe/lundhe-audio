import { Suspense } from "react";
import { unstable_noStore as noStore } from "next/cache";

import { ManifestManagerLoading } from "./_components/manifest-manager-loading";
import { ManifestManagerSection } from "./_components/manifest-manager-section";

export const dynamic = "force-dynamic";

export default function AdminManifestsPage() {
  noStore();

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-2">
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-semibold">Manage Manifests</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Build printable QR manifests from studio inventory, then scan them back
          into the same admin gear table workflow.
        </p>
      </div>

      <Suspense fallback={<ManifestManagerLoading />}>
        <ManifestManagerSection />
      </Suspense>
    </div>
  );
}
