"use client";

import * as React from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";

import {
  AdminDataTable,
  type AdminDataTableColumnDef,
  FilterTabPanel,
  SimpleFilterOption,
  SortableHeader,
} from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";
import type { Product, ProductOption } from "~/server/db/schema";

type ProductType = Product["productType"];
type OptionCategory = ProductOption["category"];
type OptionPriceType = ProductOption["priceType"];

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "mixing", label: "Mixing" },
  { value: "mastering", label: "Mastering" },
  { value: "mixing-and-mastering", label: "Mixing + Mastering" },
];

const OPTION_CATEGORIES: { value: OptionCategory; label: string }[] = [
  { value: "addon", label: "Add-on" },
  { value: "delivery", label: "Delivery" },
  { value: "track_fee", label: "Track Fee" },
  { value: "length_fee", label: "Length Fee" },
];

const OPTION_PRICE_TYPES: { value: OptionPriceType; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "per_ten_tracks", label: "Per N Tracks" },
  { value: "multiplier", label: "Multiplier" },
  { value: "per_hour", label: "Per Hour" },
];

const PRODUCT_TYPE_LABELS = Object.fromEntries(
  PRODUCT_TYPES.map((entry) => [entry.value, entry.label]),
) as Record<ProductType, string>;

const OPTION_CATEGORY_LABELS = Object.fromEntries(
  OPTION_CATEGORIES.map((entry) => [entry.value, entry.label]),
) as Record<OptionCategory, string>;

const OPTION_PRICE_TYPE_LABELS = Object.fromEntries(
  OPTION_PRICE_TYPES.map((entry) => [entry.value, entry.label]),
) as Record<OptionPriceType, string>;

interface ProductFormState {
  id: string | null;
  name: string;
  description: string;
  price: string;
  productType: ProductType;
}

const emptyProductForm: ProductFormState = {
  id: null,
  name: "",
  description: "",
  price: "0",
  productType: "mixing",
};

const productFormFromRow = (row: Product): ProductFormState => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  price: String(row.price),
  productType: row.productType,
});

interface OptionFormState {
  id: string | null;
  name: string;
  description: string;
  price: string;
  category: OptionCategory;
  priceType: OptionPriceType;
  productType: ProductType;
  perCount: string;
  minThreshold: string;
  maxThreshold: string;
}

const buildEmptyOptionForm = (
  productType: ProductType,
): OptionFormState => ({
  id: null,
  name: "",
  description: "",
  price: "0",
  category: "addon",
  priceType: "flat",
  productType,
  perCount: "1",
  minThreshold: "",
  maxThreshold: "",
});

const optionFormFromRow = (row: ProductOption): OptionFormState => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  price: String(row.price),
  category: row.category,
  priceType: row.priceType,
  productType: row.productType,
  perCount: String(row.perCount),
  minThreshold: row.minThreshold !== null ? String(row.minThreshold) : "",
  maxThreshold: row.maxThreshold !== null ? String(row.maxThreshold) : "",
});

const parseNumber = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value: string): number | null => {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  return Math.trunc(parsed);
};

// Per-category UI rules. The schema columns are uniform, but each category
// uses different subsets — so the form hides anything that would be confusing
// or meaningless for the chosen category. Server validation is the same set
// of columns regardless; this is purely a UX guard rail.
const optionFieldVisibility = (category: OptionCategory) => {
  switch (category) {
    case "addon":
    case "delivery":
      return {
        showPerCount: false,
        showMinThreshold: false,
        showMaxThreshold: false,
      };
    case "track_fee":
      return {
        showPerCount: true,
        showMinThreshold: true,
        showMaxThreshold: true,
      };
    case "length_fee":
      return {
        showPerCount: false,
        showMinThreshold: true,
        showMaxThreshold: false,
      };
  }
};

export function ProductsManager({
  initialProducts,
  initialOptions,
}: {
  initialProducts: Product[];
  initialOptions: ProductOption[];
}) {
  const [productList, setProductList] =
    React.useState<Product[]>(initialProducts);
  const [optionList, setOptionList] =
    React.useState<ProductOption[]>(initialOptions);
  const [productForm, setProductForm] =
    React.useState<ProductFormState>(emptyProductForm);
  const [optionForm, setOptionForm] = React.useState<OptionFormState>(() =>
    buildEmptyOptionForm("mixing"),
  );
  const [productError, setProductError] = React.useState<string | null>(null);
  const [optionError, setOptionError] = React.useState<string | null>(null);
  const [pendingProductDeleteId, setPendingProductDeleteId] = React.useState<
    string | null
  >(null);
  const [pendingOptionDeleteId, setPendingOptionDeleteId] = React.useState<
    string | null
  >(null);

  const optionsForCurrentType = React.useMemo(
    () =>
      optionList.filter(
        (option) => option.productType === productForm.productType,
      ),
    [optionList, productForm.productType],
  );

  const upsertProduct = api.adminProducts.upsertProduct.useMutation({
    onMutate: () => setProductError(null),
    onSuccess: (saved) => {
      setProductList((current) => {
        const next = current.filter((row) => row.id !== saved.id);
        next.push(saved);
        next.sort((a, b) => a.name.localeCompare(b.name));
        return next;
      });
      setProductForm(productFormFromRow(saved));
    },
    onError: (err) => setProductError(err.message),
  });

  const deleteProduct = api.adminProducts.deleteProduct.useMutation({
    onMutate: ({ id }) => {
      setProductError(null);
      setPendingProductDeleteId(id);
    },
    onSuccess: ({ id }) => {
      setProductList((current) => current.filter((row) => row.id !== id));
      if (productForm.id === id) setProductForm(emptyProductForm);
    },
    onError: (err) => setProductError(err.message),
    onSettled: () => setPendingProductDeleteId(null),
  });

  const upsertOption = api.adminProducts.upsertOption.useMutation({
    onMutate: () => setOptionError(null),
    onSuccess: (saved) => {
      setOptionList((current) => {
        const next = current.filter((row) => row.id !== saved.id);
        next.push(saved);
        next.sort((a, b) => {
          const byCategory = a.category.localeCompare(b.category);
          if (byCategory !== 0) return byCategory;
          return a.name.localeCompare(b.name);
        });
        return next;
      });
      setOptionForm(buildEmptyOptionForm(productForm.productType));
    },
    onError: (err) => setOptionError(err.message),
  });

  const deleteOption = api.adminProducts.deleteOption.useMutation({
    onMutate: ({ id }) => {
      setOptionError(null);
      setPendingOptionDeleteId(id);
    },
    onSuccess: ({ id }) => {
      setOptionList((current) => current.filter((row) => row.id !== id));
      if (optionForm.id === id) {
        setOptionForm(buildEmptyOptionForm(productForm.productType));
      }
    },
    onError: (err) => setOptionError(err.message),
    onSettled: () => setPendingOptionDeleteId(null),
  });

  const handleProductSelect = (product: Product) => {
    setProductForm(productFormFromRow(product));
    setOptionForm(buildEmptyOptionForm(product.productType));
    setProductError(null);
    setOptionError(null);
  };

  const handleProductSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductError(null);

    const price = parseNumber(productForm.price);
    if (price === null || price < 0) {
      setProductError("Price must be a non-negative number.");
      return;
    }

    upsertProduct.mutate({
      id: productForm.id ?? undefined,
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      price,
      productType: productForm.productType,
    });
  };

  const handleOptionSelect = (option: ProductOption) => {
    setOptionForm(optionFormFromRow(option));
    setOptionError(null);
  };

  const handleOptionSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOptionError(null);

    const price = parseNumber(optionForm.price);
    if (price === null || price < 0) {
      setOptionError("Price must be a non-negative number.");
      return;
    }

    const perCount = parseInteger(optionForm.perCount);
    if (perCount === null || perCount < 0) {
      setOptionError("Per count must be a non-negative integer.");
      return;
    }

    const visibility = optionFieldVisibility(optionForm.category);
    const minThreshold = visibility.showMinThreshold
      ? parseInteger(optionForm.minThreshold)
      : null;
    const maxThreshold = visibility.showMaxThreshold
      ? parseInteger(optionForm.maxThreshold)
      : null;

    upsertOption.mutate({
      id: optionForm.id ?? undefined,
      name: optionForm.name.trim(),
      description: optionForm.description.trim() || null,
      price,
      category: optionForm.category,
      priceType: optionForm.priceType,
      productType: optionForm.productType,
      perCount,
      minThreshold,
      maxThreshold,
    });
  };

  const productColumns = React.useMemo<AdminDataTableColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "name",
        size: 240,
        minSize: 180,
        maxSize: 320,
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="truncate text-sm font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "description",
        size: 420,
        minSize: 280,
        maxSize: 640,
        enableSorting: false,
        header: () => (
          <div className="flex h-full w-full items-center justify-start gap-3 text-left text-muted-foreground">
            Description
          </div>
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.description ?? "—"}
          </div>
        ),
      },
      {
        accessorKey: "productType",
        filterFn: "equalsString",
        size: 180,
        minSize: 140,
        maxSize: 240,
        header: ({ column }) => <SortableHeader column={column} label="Type" />,
        cell: ({ row }) => (
          <div className="truncate text-sm">
            {PRODUCT_TYPE_LABELS[row.original.productType]}
          </div>
        ),
      },
      {
        accessorKey: "price",
        size: 120,
        minSize: 100,
        maxSize: 160,
        header: ({ column }) => (
          <SortableHeader column={column} label="Price" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">${row.original.price.toFixed(2)}</div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [row.name, row.description ?? "", PRODUCT_TYPE_LABELS[row.productType]].join(
            " ",
          ),
        filterFn: "includesString",
        enableHiding: true,
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        size: 70,
        minSize: 70,
        maxSize: 70,
        header: () => <div className="w-fit" />,
        cell: ({ row }) => {
          const product = row.original;
          const isDeleting = pendingProductDeleteId === product.id;

          return (
            <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${product.name}"? This cannot be undone.`,
                    )
                  ) {
                    deleteProduct.mutate({ id: product.id });
                  }
                }}
                aria-label={`Delete ${product.name}`}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteProduct, pendingProductDeleteId],
  );

  const optionColumns = React.useMemo<AdminDataTableColumnDef<ProductOption>[]>(
    () => [
      {
        accessorKey: "name",
        size: 220,
        minSize: 180,
        maxSize: 320,
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <div className="truncate text-sm font-medium">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "description",
        size: 360,
        minSize: 260,
        maxSize: 520,
        enableSorting: false,
        header: () => (
          <div className="flex h-full w-full items-center justify-start gap-3 text-left text-muted-foreground">
            Description
          </div>
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm text-muted-foreground">
            {row.original.description ?? "—"}
          </div>
        ),
      },
      {
        accessorKey: "category",
        filterFn: "equalsString",
        size: 150,
        minSize: 120,
        maxSize: 200,
        header: ({ column }) => (
          <SortableHeader column={column} label="Category" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">
            {OPTION_CATEGORY_LABELS[row.original.category]}
          </div>
        ),
      },
      {
        accessorKey: "priceType",
        filterFn: "equalsString",
        size: 160,
        minSize: 130,
        maxSize: 220,
        header: ({ column }) => (
          <SortableHeader column={column} label="Price Type" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">
            {OPTION_PRICE_TYPE_LABELS[row.original.priceType]}
          </div>
        ),
      },
      {
        accessorKey: "price",
        size: 110,
        minSize: 90,
        maxSize: 150,
        header: ({ column }) => (
          <SortableHeader column={column} label="Price" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">${row.original.price.toFixed(2)}</div>
        ),
      },
      {
        accessorKey: "perCount",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <SortableHeader column={column} label="Per" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.perCount}</div>
        ),
      },
      {
        accessorKey: "minThreshold",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <SortableHeader column={column} label="Min" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.minThreshold ?? "—"}</div>
        ),
      },
      {
        accessorKey: "maxThreshold",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <SortableHeader column={column} label="Max" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">{row.original.maxThreshold ?? "—"}</div>
        ),
      },
      {
        id: "search",
        accessorFn: (row) =>
          [
            row.name,
            row.description ?? "",
            OPTION_CATEGORY_LABELS[row.category],
            OPTION_PRICE_TYPE_LABELS[row.priceType],
          ].join(" "),
        filterFn: "includesString",
        enableHiding: true,
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        size: 70,
        minSize: 70,
        maxSize: 70,
        header: () => <div className="w-fit" />,
        cell: ({ row }) => {
          const option = row.original;
          const isDeleting = pendingOptionDeleteId === option.id;

          return (
            <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isDeleting}
                onClick={() => {
                  if (window.confirm(`Delete option "${option.name}"?`)) {
                    deleteOption.mutate({ id: option.id });
                  }
                }}
                aria-label={`Delete ${option.name}`}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteOption, pendingOptionDeleteId],
  );

  const visibility = optionFieldVisibility(optionForm.category);
  const isEditingProduct = productForm.id !== null;
  const isEditingOption = optionForm.id !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* Products list */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {productList.length} product
            {productList.length === 1 ? "" : "s"}. Click a row to edit, or use
            the form below to add a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet.</p>
          ) : (
            <AdminDataTable
              data={productList}
              columns={productColumns}
              footerControlsLayout="stacked-mobile"
              searchColumnId="search"
              searchPlaceholder="Search products..."
              emptyMessage="No results."
              initialSorting={[{ id: "name", desc: false }]}
              initialColumnVisibility={{ search: false }}
              initialColumnOrder={[
                "name",
                "description",
                "productType",
                "price",
                "search",
                "actions",
              ]}
              invisibleColumns={["search"]}
              columnLabels={{
                name: "name",
                description: "description",
                productType: "type",
                price: "price",
              }}
              getRowClassName={(row) =>
                productForm.id === row.original.id ? "bg-muted" : undefined
              }
              onRowClick={handleProductSelect}
              filterTabs={[
                {
                  value: "type",
                  label: "Type",
                  render: (table) => (
                    <FilterTabPanel>
                      <SimpleFilterOption
                        active={
                          (table.getColumn("productType")?.getFilterValue() ?? "") === ""
                        }
                        label="All"
                        onToggle={() =>
                          table.getColumn("productType")?.setFilterValue("")
                        }
                      />
                      <Separator />
                      {PRODUCT_TYPES.map((option) => (
                        <SimpleFilterOption
                          key={option.value}
                          active={
                            (table.getColumn("productType")?.getFilterValue() ?? "") ===
                            option.value
                          }
                          label={option.label}
                          onToggle={() =>
                            table
                              .getColumn("productType")
                              ?.setFilterValue(
                                (table.getColumn("productType")?.getFilterValue() ?? "") ===
                                  option.value
                                  ? ""
                                  : option.value,
                              )
                          }
                        />
                      ))}
                    </FilterTabPanel>
                  ),
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Product form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditingProduct ? "Edit Product" : "Add Product"}
          </CardTitle>
          <CardDescription>
            {isEditingProduct
              ? `Editing "${productForm.name || "(unnamed)"}".`
              : "Fill in the form to create a new product."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productError ? (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {productError}
            </div>
          ) : null}
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleProductSubmit}
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={productForm.name}
                onChange={(event) =>
                  setProductForm({ ...productForm, name: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="product-price">Price (USD)</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                step="0.01"
                value={productForm.price}
                onChange={(event) =>
                  setProductForm({ ...productForm, price: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="product-type">Product Type</Label>
              <Select
                value={productForm.productType}
                onValueChange={(value) =>
                  setProductForm({
                    ...productForm,
                    productType: value as ProductType,
                  })
                }
              >
                <SelectTrigger id="product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={productForm.description}
                onChange={(event) =>
                  setProductForm({
                    ...productForm,
                    description: event.target.value,
                  })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" disabled={upsertProduct.isPending}>
                {upsertProduct.isPending ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : isEditingProduct ? (
                  <Save className="mr-2 !h-[16px] !w-[16px]" />
                ) : (
                  <Plus className="mr-2 !h-[16px] !w-[16px]" />
                )}
                {isEditingProduct ? "Save Product" : "Add Product"}
              </Button>
              {isEditingProduct ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProductForm(emptyProductForm)}
                  disabled={upsertProduct.isPending}
                >
                  <X className="mr-2 !h-[16px] !w-[16px]" />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Options for the selected product type */}
      <Card>
        <CardHeader>
          <CardTitle>
            Options for {productForm.productType}
          </CardTitle>
          <CardDescription>
            {optionsForCurrentType.length} option
            {optionsForCurrentType.length === 1 ? "" : "s"}. Options apply to
            every product of this type.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {optionsForCurrentType.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No options for this product type yet.
            </p>
          ) : (
            <AdminDataTable
              data={optionsForCurrentType}
              columns={optionColumns}
              footerControlsLayout="stacked-mobile"
              searchColumnId="search"
              searchPlaceholder="Search options..."
              emptyMessage="No results."
              initialSorting={[
                { id: "category", desc: false },
                { id: "name", desc: false },
              ]}
              initialColumnVisibility={{ search: false }}
              initialColumnOrder={[
                "name",
                "description",
                "category",
                "priceType",
                "price",
                "perCount",
                "minThreshold",
                "maxThreshold",
                "search",
                "actions",
              ]}
              invisibleColumns={["search"]}
              columnLabels={{
                name: "name",
                description: "description",
                category: "category",
                priceType: "price type",
                price: "price",
                perCount: "per",
                minThreshold: "min",
                maxThreshold: "max",
              }}
              getRowClassName={(row) =>
                optionForm.id === row.original.id ? "bg-muted" : undefined
              }
              onRowClick={handleOptionSelect}
              filterTabs={[
                {
                  value: "category",
                  label: "Category",
                  render: (table) => (
                    <FilterTabPanel>
                      <SimpleFilterOption
                        active={
                          (table.getColumn("category")?.getFilterValue() ?? "") === ""
                        }
                        label="All"
                        onToggle={() => table.getColumn("category")?.setFilterValue("")}
                      />
                      <Separator />
                      {OPTION_CATEGORIES.map((option) => (
                        <SimpleFilterOption
                          key={option.value}
                          active={
                            (table.getColumn("category")?.getFilterValue() ?? "") ===
                            option.value
                          }
                          label={option.label}
                          onToggle={() =>
                            table
                              .getColumn("category")
                              ?.setFilterValue(
                                (table.getColumn("category")?.getFilterValue() ?? "") ===
                                  option.value
                                  ? ""
                                  : option.value,
                              )
                          }
                        />
                      ))}
                    </FilterTabPanel>
                  ),
                },
                {
                  value: "pricing",
                  label: "Pricing",
                  render: (table) => (
                    <FilterTabPanel>
                      <SimpleFilterOption
                        active={
                          (table.getColumn("priceType")?.getFilterValue() ?? "") === ""
                        }
                        label="All"
                        onToggle={() => table.getColumn("priceType")?.setFilterValue("")}
                      />
                      <Separator />
                      {OPTION_PRICE_TYPES.map((option) => (
                        <SimpleFilterOption
                          key={option.value}
                          active={
                            (table.getColumn("priceType")?.getFilterValue() ?? "") ===
                            option.value
                          }
                          label={option.label}
                          onToggle={() =>
                            table
                              .getColumn("priceType")
                              ?.setFilterValue(
                                (table.getColumn("priceType")?.getFilterValue() ?? "") ===
                                  option.value
                                  ? ""
                                  : option.value,
                              )
                          }
                        />
                      ))}
                    </FilterTabPanel>
                  ),
                },
              ]}
            />
          )}

          {optionError ? (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {optionError}
            </div>
          ) : null}

          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleOptionSubmit}
            noValidate
          >
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <h3 className="text-sm font-semibold">
                {isEditingOption ? "Edit Option" : "Add Option"}
              </h3>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="option-name">Name</Label>
              <Input
                id="option-name"
                value={optionForm.name}
                onChange={(event) =>
                  setOptionForm({ ...optionForm, name: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="option-price">Price</Label>
              <Input
                id="option-price"
                type="number"
                min={0}
                step="0.01"
                value={optionForm.price}
                onChange={(event) =>
                  setOptionForm({ ...optionForm, price: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="option-category">Category</Label>
              <Select
                value={optionForm.category}
                onValueChange={(value) =>
                  setOptionForm({
                    ...optionForm,
                    category: value as OptionCategory,
                  })
                }
              >
                <SelectTrigger id="option-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTION_CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="option-price-type">Price Type</Label>
              <Select
                value={optionForm.priceType}
                onValueChange={(value) =>
                  setOptionForm({
                    ...optionForm,
                    priceType: value as OptionPriceType,
                  })
                }
              >
                <SelectTrigger id="option-price-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPTION_PRICE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="option-product-type">Product Type</Label>
              <Select
                value={optionForm.productType}
                onValueChange={(value) =>
                  setOptionForm({
                    ...optionForm,
                    productType: value as ProductType,
                  })
                }
              >
                <SelectTrigger id="option-product-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {visibility.showPerCount ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="option-per-count">Per Count</Label>
                <Input
                  id="option-per-count"
                  type="number"
                  min={0}
                  step={1}
                  value={optionForm.perCount}
                  onChange={(event) =>
                    setOptionForm({
                      ...optionForm,
                      perCount: event.target.value,
                    })
                  }
                />
              </div>
            ) : null}
            {visibility.showMinThreshold ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="option-min-threshold">Min Threshold</Label>
                <Input
                  id="option-min-threshold"
                  type="number"
                  step={1}
                  value={optionForm.minThreshold}
                  onChange={(event) =>
                    setOptionForm({
                      ...optionForm,
                      minThreshold: event.target.value,
                    })
                  }
                  placeholder="leave blank for none"
                />
              </div>
            ) : null}
            {visibility.showMaxThreshold ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="option-max-threshold">Max Threshold</Label>
                <Input
                  id="option-max-threshold"
                  type="number"
                  step={1}
                  value={optionForm.maxThreshold}
                  onChange={(event) =>
                    setOptionForm({
                      ...optionForm,
                      maxThreshold: event.target.value,
                    })
                  }
                  placeholder="leave blank for none"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="option-description">Description</Label>
              <Textarea
                id="option-description"
                value={optionForm.description}
                onChange={(event) =>
                  setOptionForm({
                    ...optionForm,
                    description: event.target.value,
                  })
                }
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" disabled={upsertOption.isPending}>
                {upsertOption.isPending ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : isEditingOption ? (
                  <Save className="mr-2 !h-[16px] !w-[16px]" />
                ) : (
                  <Plus className="mr-2 !h-[16px] !w-[16px]" />
                )}
                {isEditingOption ? "Save Option" : "Add Option"}
              </Button>
              {isEditingOption ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setOptionForm(buildEmptyOptionForm(productForm.productType))
                  }
                  disabled={upsertOption.isPending}
                >
                  <X className="mr-2 !h-[16px] !w-[16px]" />
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
