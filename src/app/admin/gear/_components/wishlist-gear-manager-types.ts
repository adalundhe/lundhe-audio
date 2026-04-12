"use client";

import type { RouterOutputs } from "~/trpc/react";

export type WishlistGearItem = RouterOutputs["adminGear"]["listWishlist"][number];
export type WishlistStatus = WishlistGearItem["status"];

export interface WishlistGearFormState {
  id: string | null;
  name: string;
  description: string;
  type: string;
  group: string;
  price: string;
  quantity: string;
  manufacturer: string;
}

export interface WishlistGearDetailsFormState {
  status: WishlistStatus;
  notes: string;
}

export const wishlistStatusMetadata: Record<
  WishlistStatus,
  {
    label: string;
    dotClassName: string;
    labelClassName: string;
    switchClassName: string;
    containerClassName: string;
  }
> = {
  researching: {
    label: "Researching",
    dotClassName: "bg-pink-500",
    labelClassName: "text-pink-500",
    switchClassName: "bg-pink-500/25 border border-pink-500",
    containerClassName: "bg-pink-500/10 border border-pink-500"
  },
  watching: {
    label: "Watching",
    dotClassName: "bg-blue-500",
    labelClassName: "text-blue-500",
    switchClassName: "bg-blue-500/25 border border-blue-500",
    containerClassName: "bg-blue-500/10 border border-blue-500"
  },
  "ready-to-buy": {
    label: "Ready to Buy",
    dotClassName: "bg-green-500",
    labelClassName: "text-green-500",
    switchClassName: "bg-green-500/25 border border-green-500",
    containerClassName: "bg-green-500/10 border border-green-500"
  },
};

export const wishlistStatusOrder: WishlistStatus[] = [
  "researching",
  "watching",
  "ready-to-buy",
];
