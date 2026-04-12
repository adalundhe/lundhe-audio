"use client";

import type { ChartConfig } from "~/components/ui/chart";

export type WishlistSummaryGroup = {
  label: string;
  uniqueItemCount: number;
  fullyCataloguedCount: number;
  cataloguedPercent: number;
  totalQuantity: number;
  totalValue: number;
  types: Array<{ label: string; totalQuantity: number; totalValue: number }>;
};

export type WishlistSummary = {
  totalQuantity: number;
  uniqueItemCount: number;
  manufacturerCount: number;
  totalValue: number;
  fullyCataloguedCount: number;
  cataloguedPercent: number;
  groups: WishlistSummaryGroup[];
};

export type WishlistValuePoint = {
  group: string;
  groupLabel: string;
  targetValue: number;
};

export type WishlistSpendPoint = {
  name: string;
  quantity: number;
  itemValue: number;
  createdAtMs: number;
  createdAtTooltipLabel: string;
};

export type WishlistSpendByGroupAreaChart = {
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  series: Array<{ key: string; color: string }>;
};
