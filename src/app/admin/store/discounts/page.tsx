import { api } from "~/lib/server-client";

import { DiscountsManager } from "./_components/discounts-manager";

export default async function AdminStoreDiscountsPage() {
  const trpc = await api();
  const discounts = await trpc.adminDiscounts.list();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-semibold">Discounts</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Add or edit pricing discounts. The form adapts to the selected
          category — thresholds mean different things depending on the type.
        </p>
      </div>

      <DiscountsManager initialDiscounts={discounts} />
    </div>
  );
}
