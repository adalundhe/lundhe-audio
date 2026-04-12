"use client";

import type * as React from "react";
import { format } from "date-fns";
import type { ChartConfig } from "~/components/ui/chart";
import type {
  WishlistGearDetailsFormState,
  WishlistGearFormState,
  WishlistGearItem,
} from "./wishlist-gear-manager-types";
import type { ModelHistoryPoint } from "./gear-manager-types";

export const emptyWishlistForm: WishlistGearFormState = {
  id: null,
  name: "",
  description: "",
  type: "",
  group: "",
  price: "0.00",
  quantity: "1",
  manufacturer: "",
};

export const emptyWishlistDetailsForm: WishlistGearDetailsFormState = {
  status: "watching",
  notes: "",
};

export const NEW_WISHLIST_ROW_ID = "__new-wishlist-row__";

export const normalizeStoredNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeQuantity = (value: unknown): number =>
  Math.trunc(Math.max(normalizeStoredNumber(value), 0));

export const normalizeCurrency = (value: unknown): number =>
  Number(normalizeStoredNumber(value).toFixed(2));

export const normalizeText = (value: string) => value.trim();

export const normalizeOptionValue = (value: string) =>
  value.trim().toLocaleLowerCase();

export const parseNumber = (value: string): number | null => {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const sanitizeReverbQuerySegment = (value: string) =>
  value.trim().replace(/^[\s\-–—:|/&,]+/, "").replace(/[\s\-–—:|/&,]+$/, "");

export const buildReverbQuery = (...segments: string[]) => {
  const uniqueSegments = [
    ...new Map(
      segments
        .map(sanitizeReverbQuerySegment)
        .filter(Boolean)
        .map((segment) => [normalizeOptionValue(segment), segment]),
    ).values(),
  ];

  return uniqueSegments.join("&");
};

export const buildDefaultReverbPricingQuery = ({
  manufacturer,
  name,
}: {
  manufacturer: string;
  name: string;
}) => {
  const trimmedManufacturer = manufacturer.trim();
  const trimmedName = name.trim();

  if (!trimmedManufacturer) {
    return sanitizeReverbQuerySegment(trimmedName);
  }

  if (!trimmedName) {
    return sanitizeReverbQuerySegment(trimmedManufacturer);
  }

  const normalizedManufacturer = normalizeOptionValue(trimmedManufacturer);
  const normalizedName = normalizeOptionValue(trimmedName);
  const strippedName = normalizedName.startsWith(normalizedManufacturer)
    ? sanitizeReverbQuerySegment(trimmedName.slice(trimmedManufacturer.length))
    : trimmedName;

  return buildReverbQuery(trimmedManufacturer, strippedName);
};

export const mergeUniqueOptions = (...collections: string[][]) =>
  [
    ...new Map(
      collections
        .flat()
        .map((value) => value.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => [normalizeOptionValue(value), value]),
    ).values(),
  ];

export const groupOptionsAlphabetically = (options: string[]) =>
  options.reduce(
    (grouped, option) => {
      const normalizedOption = option.trim();
      if (!normalizedOption) {
        return grouped;
      }

      const groupKey = normalizedOption.at(0)?.toLocaleUpperCase() ?? "#";
      grouped[groupKey] ??= [];
      grouped[groupKey].push(normalizedOption);
      return grouped;
    },
    {} as Record<string, string[]>,
  );

export const handleNumberInputWheel = (
  event: React.WheelEvent<HTMLInputElement>,
) => {
  event.currentTarget.blur();
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export const abbreviateCurrency = (value: number) => {
  if (value >= 10000) {
    return `$${Math.round(value / 1000)}k`;
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return `$${Math.round(value)}`;
};

export const calculateAverage = (values: number[]): number | null => {
  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
};

export const normalizeWishlistItem = (item: WishlistGearItem): WishlistGearItem => ({
  ...item,
  name: normalizeText(item.name),
  description: normalizeText(item.description),
  type: normalizeText(item.type),
  group: normalizeText(item.group),
  manufacturer: normalizeText(item.manufacturer),
  notes: normalizeText(item.notes),
  targetPrice: normalizeCurrency(item.targetPrice),
  quantity: normalizeQuantity(item.quantity),
  status:
    item.status === "researching" || item.status === "ready-to-buy"
      ? item.status
      : "watching",
});

export const wishlistFormFromItem = (
  item: WishlistGearItem,
): WishlistGearFormState => ({
  id: item.id,
  name: item.name,
  description: item.description,
  type: item.type,
  group: item.group,
  price: normalizeCurrency(item.targetPrice).toFixed(2),
  quantity: String(normalizeQuantity(item.quantity)),
  manufacturer: item.manufacturer,
});

export const wishlistDetailsFormFromItem = (
  item: WishlistGearItem,
): WishlistGearDetailsFormState => ({
  status: item.status,
  notes: item.notes,
});

export const wishlistDraftItemFromState = ({
  form,
  details,
}: {
  form: WishlistGearFormState;
  details: WishlistGearDetailsFormState;
}): WishlistGearItem => ({
  id: NEW_WISHLIST_ROW_ID,
  name: form.name.trim(),
  description: form.description.trim(),
  type: form.type.trim(),
  group: form.group.trim(),
  status: details.status,
  targetPrice: normalizeCurrency(form.price),
  quantity: normalizeQuantity(form.quantity),
  manufacturer: form.manufacturer.trim(),
  notes: details.notes,
  created_timestamp: "",
  updated_timestamp: null,
});

export const getModelHistorySeriesLabel = (
  point: Pick<ModelHistoryPoint, "model" | "title">,
) => {
  const model = point.model?.trim();
  if (model && model !== "—") {
    return model;
  }

  const title = point.title?.trim();
  if (title) {
    return title;
  }

  return "Unknown Model";
};

export const getModelHistorySeriesKey = (
  point: Pick<ModelHistoryPoint, "model" | "title">,
) => normalizeOptionValue(getModelHistorySeriesLabel(point));

export const getHistoryFilterLabel = (
  value: string | null | undefined,
  fallback = "Unknown",
) => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "—") {
    return fallback;
  }

  return trimmed;
};

export const getHistoryFilterKey = (
  value: string | null | undefined,
  fallback = "unknown",
) => normalizeOptionValue(getHistoryFilterLabel(value, fallback));

export const getVisibleHistoryCategoryLabels = (
  point: Pick<ModelHistoryPoint, "categories">,
  fallback = "Unknown",
) => {
  const labels = (point.categories ?? [])
    .map((category) => category.trim())
    .filter(Boolean);

  return labels.length > 0 ? labels : [fallback];
};

export const sortChartFilterOptionsAlphabetically = <
  T extends { label: string },
>(
  options: T[],
) =>
  [...options].sort((left, right) =>
    left.label.localeCompare(right.label, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

export const getChartYearValue = (label: string) => {
  const match = label.match(/\d{4}/);
  return match ? Number(match[0]) : Number.NaN;
};

export const sortChartFilterOptionsByYear = <T extends { label: string }>(
  options: T[],
) =>
  [...options].sort((left, right) => {
    const leftYear = getChartYearValue(left.label);
    const rightYear = getChartYearValue(right.label);
    const leftHasYear = Number.isFinite(leftYear);
    const rightHasYear = Number.isFinite(rightYear);

    if (leftHasYear && rightHasYear) {
      return leftYear - rightYear || left.label.localeCompare(right.label);
    }

    if (leftHasYear) return -1;
    if (rightHasYear) return 1;

    return left.label.localeCompare(right.label, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

export const buildSelectedHistoryChartConfig = (
  series: Array<{ key: string; label: string; color: string }>,
) =>
  series.reduce<ChartConfig>(
    (config, entry) => ({
      ...config,
      [entry.key]: {
        label: entry.label,
        color: entry.color,
      },
    }),
    {},
  );

export const chartColorTokens = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export const buildOccurredAtLabel = (occurredAtMs: number | null) =>
  occurredAtMs === null ? "Unknown" : format(new Date(occurredAtMs), "MMM d, yyyy");
