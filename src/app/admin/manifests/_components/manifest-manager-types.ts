"use client";

import type { RouterOutputs } from "~/trpc/react";

export type ManifestGearItem = RouterOutputs["adminGear"]["list"][number];
export type GearManifest = RouterOutputs["adminManifests"]["list"][number];
export type GearManifestEntry = GearManifest["entries"][number];
