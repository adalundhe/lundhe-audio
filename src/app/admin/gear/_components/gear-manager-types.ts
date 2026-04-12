"use client";

import type { RouterOutputs } from "~/trpc/react";

export type GearItem = RouterOutputs["adminGear"]["list"][number];
export type GearServiceLog = GearItem["serviceLogs"][number];
export type PriceGuideMatch = RouterOutputs["adminGear"]["searchPriceGuide"][number];
export type ModelHistoryPoint =
  RouterOutputs["adminGear"]["searchModelHistory"]["matches"][number];
export type GearStatus = GearItem["status"];

export interface GearFormState {
  id: string | null;
  name: string;
  description: string;
  type: string;
  group: string;
  price: string;
  quantity: string;
  manufacturer: string;
}

export interface GearDetailsFormState {
  status: GearStatus;
  location: string;
  notes: string;
}

export interface ServiceLogFormState {
  serviceType: string;
  serviceDate: string;
  warrantyUntil: string;
  notes: string;
}

export const gearStatusMetadata: Record<
  GearStatus,
  {
    label: string;
    dotClassName: string;
    labelClassName: string;
    switchClassName: string;
    containerClassName: string;
  }
> = {
  active: {
    label: "Active",
    dotClassName: "bg-green-500",
    labelClassName: "text-green-400",
    switchClassName: "bg-green-500/25 border border-green-500",
    containerClassName: "bg-green-500/10 border border-green-500"
  },
  inactive: {
    label: "Inactive",
    dotClassName: "bg-zinc-500",
    labelClassName: "text-zinc-300",
    switchClassName: "bg-zinc-500/25 border border-zinc-500",
    containerClassName: "bg-zinc-500/10 border border-zinc-500"
  },
  "out-of-order": {
    label: "Out of Order",
    dotClassName: "bg-red-500",
    labelClassName: "text-red-400",
    switchClassName: "bg-red-500/25 border border-red-500",
    containerClassName: "bg-red-500/10 border border-red-500"
  },
};

export const gearStatusOrder: GearStatus[] = [
  "active",
  "inactive",
  "out-of-order",
];

