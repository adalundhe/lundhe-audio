"use client";

import * as React from "react";

import {
  combineGearManifestQrParts,
  getGearManifestQrPartKey,
  parseGearManifestQrPart,
  type GearManifestQrPart,
} from "~/lib/gear-manifests/qr";

export function useManifestScan() {
  const [parts, setParts] = React.useState<GearManifestQrPart[]>([]);
  const [scanError, setScanError] = React.useState<string | null>(null);

  const addRawValue = React.useCallback((rawValue: string) => {
    const parsedPart = parseGearManifestQrPart(rawValue);

    if (!parsedPart) {
      setScanError("That QR code does not contain a valid gear manifest payload.");
      return;
    }

    setScanError(null);
    setParts((current) => {
      const activeManifestId = current[0]?.m;
      const scopedParts =
        activeManifestId && activeManifestId !== parsedPart.m ? [] : current;
      const nextParts = new Map(
        scopedParts.map((part) => [getGearManifestQrPartKey(part), part]),
      );

      nextParts.set(getGearManifestQrPartKey(parsedPart), parsedPart);
      return [...nextParts.values()].sort((left, right) => left.p - right.p);
    });
  }, []);

  const clear = React.useCallback(() => {
    setParts([]);
    setScanError(null);
  }, []);

  return {
    parts,
    combined: React.useMemo(() => combineGearManifestQrParts(parts), [parts]),
    scanError,
    addRawValue,
    clear,
  };
}
