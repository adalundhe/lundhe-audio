import { api } from "~/lib/server-client";

import { ProductsManager } from "./_components/products-manager";

export default async function AdminStoreProductsPage() {
  const trpc = await api();
  const { products, options } = await trpc.adminProducts.list();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Add or edit products and their associated options. Options are scoped
          by product type, so editing one option affects every product of that
          type.
        </p>
      </div>

      <ProductsManager initialProducts={products} initialOptions={options} />
    </div>
  );
}
