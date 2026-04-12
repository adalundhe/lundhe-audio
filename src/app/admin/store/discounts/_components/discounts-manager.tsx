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
import type { Discount } from "~/server/db/schema";

type DiscountCategory = Discount["category"];
type ProductType = Discount["productType"];

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "mixing", label: "Mixing" },
  { value: "mastering", label: "Mastering" },
  { value: "mixing-and-mastering", label: "Mixing + Mastering" },
];

const PRODUCT_TYPE_LABELS = Object.fromEntries(
  PRODUCT_TYPES.map((entry) => [entry.value, entry.label]),
) as Record<ProductType, string>;

interface DiscountCategoryConfig {
  value: DiscountCategory;
  label: string;
  /** Short description shown next to the category dropdown. */
  hint: string;
  /** Whether the threshold inputs are meaningful for this category. */
  showThresholds: boolean;
  /** Label and helper used for the threshold inputs when shown. */
  thresholdLabels: { min: string; max: string };
  /** Helper text describing what `discountPercentage` means here. */
  percentageHint: string;
}

// Mapping comes from the pricing-calculator research:
//
// - volume          → applies to the base song-cost subtotal once a song-count
//                     threshold is crossed.
// - option_volume   → per-add-on count thresholds; applies to that add-on price.
// - production /    → bundle deals: triggered by 2+ or 3+ specific add-ons on
//   bundle            the same song. Thresholds aren't checked, but they're
//                     stored uniformly.
// - delivery_bundle → same idea, but counting delivery options on a song.
// - cart_bundle     → reserved for future cart-level bundles.
const DISCOUNT_CATEGORIES: DiscountCategoryConfig[] = [
  {
    value: "volume",
    label: "Volume",
    hint: "Triggered by total song count in the order. Applies to base song costs.",
    showThresholds: true,
    thresholdLabels: { min: "Min songs", max: "Max songs" },
    percentageHint: "% off the base song subtotal once song count is in range.",
  },
  {
    value: "option_volume",
    label: "Option volume",
    hint: "Triggered by how many songs include a given add-on. Applies to that add-on price.",
    showThresholds: true,
    thresholdLabels: { min: "Min option count", max: "Max option count" },
    percentageHint: "% off the individual option price.",
  },
  {
    value: "production",
    label: "Production deal",
    hint: "Bundle deal for production add-ons. Match by id (production_deal / premium_production_deal).",
    showThresholds: false,
    thresholdLabels: { min: "Min", max: "Max" },
    percentageHint: "% off each bundled add-on price when 2+ (or 3+) services are selected on the same song.",
  },
  {
    value: "bundle",
    label: "Bundle",
    hint: "Bundle deal for production add-ons. Same idea as Production but uses bundle ids.",
    showThresholds: false,
    thresholdLabels: { min: "Min", max: "Max" },
    percentageHint: "% off each bundled add-on price.",
  },
  {
    value: "delivery_bundle",
    label: "Delivery bundle",
    hint: "Bundle deal for delivery options on the same song.",
    showThresholds: false,
    thresholdLabels: { min: "Min", max: "Max" },
    percentageHint: "% off each bundled delivery option price.",
  },
  {
    value: "cart_bundle",
    label: "Cart bundle (reserved)",
    hint: "Reserved for future cart-level bundling. Not currently consumed by the pricing calculator.",
    showThresholds: true,
    thresholdLabels: { min: "Min cart total", max: "Max cart total" },
    percentageHint: "% off the cart total.",
  },
];

const categoryConfig = (category: DiscountCategory): DiscountCategoryConfig =>
  DISCOUNT_CATEGORIES.find((entry) => entry.value === category) ??
  DISCOUNT_CATEGORIES[0]!;

interface DiscountFormState {
  id: string | null;
  name: string;
  description: string;
  discountPercentage: string;
  category: DiscountCategory;
  productType: ProductType;
  minThreshold: string;
  maxThreshold: string;
}

const emptyDiscountForm: DiscountFormState = {
  id: null,
  name: "",
  description: "",
  discountPercentage: "0",
  category: "volume",
  productType: "mixing",
  minThreshold: "",
  maxThreshold: "",
};

const formFromRow = (row: Discount): DiscountFormState => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  discountPercentage: String(row.discountPercentage),
  category: row.category,
  productType: row.productType,
  minThreshold: row.minThreshold !== null ? String(row.minThreshold) : "",
  maxThreshold: row.maxThreshold !== null ? String(row.maxThreshold) : "",
});

const parseInteger = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
};

export function DiscountsManager({
  initialDiscounts,
}: {
  initialDiscounts: Discount[];
}) {
  const [discountList, setDiscountList] =
    React.useState<Discount[]>(initialDiscounts);
  const [form, setForm] = React.useState<DiscountFormState>(emptyDiscountForm);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(
    null,
  );

  const config = categoryConfig(form.category);
  const isEditing = form.id !== null;

  const upsertMutation = api.adminDiscounts.upsert.useMutation({
    onMutate: () => setError(null),
    onSuccess: (saved) => {
      setDiscountList((current) => {
        const next = current.filter((row) => row.id !== saved.id);
        next.push(saved);
        next.sort((a, b) => {
          const byCategory = a.category.localeCompare(b.category);
          if (byCategory !== 0) return byCategory;
          return a.name.localeCompare(b.name);
        });
        return next;
      });
      setForm(formFromRow(saved));
    },
    onError: (err) => setError(err.message),
  });

  const deleteMutation = api.adminDiscounts.delete.useMutation({
    onMutate: ({ id }) => {
      setError(null);
      setPendingDeleteId(id);
    },
    onSuccess: ({ id }) => {
      setDiscountList((current) => current.filter((row) => row.id !== id));
      if (form.id === id) setForm(emptyDiscountForm);
    },
    onError: (err) => setError(err.message),
    onSettled: () => setPendingDeleteId(null),
  });

  const handleSelect = (discount: Discount) => {
    setForm(formFromRow(discount));
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const percentage = Number(form.discountPercentage);
    if (
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      setError("Discount percentage must be between 0 and 100.");
      return;
    }

    const minThreshold = config.showThresholds
      ? parseInteger(form.minThreshold)
      : null;
    const maxThreshold = config.showThresholds
      ? parseInteger(form.maxThreshold)
      : null;

    if (
      config.showThresholds &&
      minThreshold !== null &&
      maxThreshold !== null &&
      minThreshold > maxThreshold
    ) {
      setError("Min threshold must be less than or equal to max threshold.");
      return;
    }

    upsertMutation.mutate({
      id: form.id ?? undefined,
      name: form.name.trim(),
      description: form.description.trim() || null,
      discountPercentage: percentage,
      category: form.category,
      productType: form.productType,
      minThreshold,
      maxThreshold,
    });
  };

  const discountColumns = React.useMemo<AdminDataTableColumnDef<Discount>[]>(
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
        size: 380,
        minSize: 260,
        maxSize: 560,
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
        size: 170,
        minSize: 130,
        maxSize: 240,
        header: ({ column }) => (
          <SortableHeader column={column} label="Category" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">
            {categoryConfig(row.original.category).label}
          </div>
        ),
      },
      {
        accessorKey: "productType",
        filterFn: "equalsString",
        size: 180,
        minSize: 140,
        maxSize: 240,
        header: ({ column }) => (
          <SortableHeader column={column} label="Product Type" />
        ),
        cell: ({ row }) => (
          <div className="truncate text-sm">
            {PRODUCT_TYPE_LABELS[row.original.productType]}
          </div>
        ),
      },
      {
        accessorKey: "discountPercentage",
        size: 90,
        minSize: 70,
        maxSize: 120,
        header: ({ column }) => (
          <SortableHeader column={column} label="%" align="end" />
        ),
        cell: ({ row }) => (
          <div className="text-right text-sm">
            {row.original.discountPercentage}%
          </div>
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
            categoryConfig(row.category).label,
            PRODUCT_TYPE_LABELS[row.productType],
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
          const discount = row.original;
          const isDeleting = pendingDeleteId === discount.id;

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
                      `Delete "${discount.name}"? This cannot be undone.`,
                    )
                  ) {
                    deleteMutation.mutate({ id: discount.id });
                  }
                }}
                aria-label={`Delete ${discount.name}`}
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
    [deleteMutation, pendingDeleteId],
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>All Discounts</CardTitle>
          <CardDescription>
            {discountList.length} discount
            {discountList.length === 1 ? "" : "s"}. Click a row to edit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discountList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discounts yet.</p>
          ) : (
            <AdminDataTable
              data={discountList}
              columns={discountColumns}
              searchColumnId="search"
              searchPlaceholder="Search discounts..."
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
                "productType",
                "discountPercentage",
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
                productType: "product type",
                discountPercentage: "%",
                minThreshold: "min",
                maxThreshold: "max",
              }}
              getRowClassName={(row) =>
                form.id === row.original.id ? "bg-muted" : undefined
              }
              onRowClick={handleSelect}
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
                      {DISCOUNT_CATEGORIES.map((option) => (
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

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Discount" : "Add Discount"}</CardTitle>
          <CardDescription>{config.hint}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discount-name">Name</Label>
              <Input
                id="discount-name"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discount-percentage">Percentage</Label>
              <Input
                id="discount-percentage"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.discountPercentage}
                onChange={(event) =>
                  setForm({
                    ...form,
                    discountPercentage: event.target.value,
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                {config.percentageHint}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discount-category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm({ ...form, category: value as DiscountCategory })
                }
              >
                <SelectTrigger id="discount-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_CATEGORIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discount-product-type">Product Type</Label>
              <Select
                value={form.productType}
                onValueChange={(value) =>
                  setForm({ ...form, productType: value as ProductType })
                }
              >
                <SelectTrigger id="discount-product-type">
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
            {config.showThresholds ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="discount-min-threshold">
                    {config.thresholdLabels.min}
                  </Label>
                  <Input
                    id="discount-min-threshold"
                    type="number"
                    step={1}
                    value={form.minThreshold}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        minThreshold: event.target.value,
                      })
                    }
                    placeholder="leave blank for none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="discount-max-threshold">
                    {config.thresholdLabels.max}
                  </Label>
                  <Input
                    id="discount-max-threshold"
                    type="number"
                    step={1}
                    value={form.maxThreshold}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        maxThreshold: event.target.value,
                      })
                    }
                    placeholder="leave blank for none"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2 rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                This discount type doesn&apos;t use threshold inputs — the
                pricing calculator matches it by id (e.g.{" "}
                <code className="font-mono">production_deal</code>) and applies
                it when 2+ or 3+ matching options are present on the same song.
              </div>
            )}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="discount-description">Description</Label>
              <Textarea
                id="discount-description"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <Loader2 className="mr-2 !h-[16px] !w-[16px] animate-spin" />
                ) : isEditing ? (
                  <Save className="mr-2 !h-[16px] !w-[16px]" />
                ) : (
                  <Plus className="mr-2 !h-[16px] !w-[16px]" />
                )}
                {isEditing ? "Save Discount" : "Add Discount"}
              </Button>
              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForm(emptyDiscountForm)}
                  disabled={upsertMutation.isPending}
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
