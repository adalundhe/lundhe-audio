"use client";

import type { CSSProperties } from "react";
import { scaleOrdinal } from "@visx/scale";

import { type ManufacturerRadialDatum } from "./manufacturer-radial-chart-helpers";

export interface ManufacturerCircle extends ManufacturerRadialDatum {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  gradientTo: string;
}

type RelaxedManufacturerCircle = ManufacturerCircle & {
  anchorX: number;
  anchorY: number;
};

const manufacturerChartColorTokens = [
  "hsl(var(--manufacturer-chart-1))",
  "hsl(var(--manufacturer-chart-2))",
  "hsl(var(--manufacturer-chart-3))",
  "hsl(var(--manufacturer-chart-4))",
  "hsl(var(--manufacturer-chart-5))",
  "hsl(var(--manufacturer-chart-6))",
  "hsl(var(--manufacturer-chart-7))",
  "hsl(var(--manufacturer-chart-8))",
];

export const manufacturerChartColorVars = {
  "--manufacturer-chart-1": "188 94% 43%",
  "--manufacturer-chart-2": "38 92% 50%",
  "--manufacturer-chart-3": "160 84% 39%",
  "--manufacturer-chart-4": "271 91% 65%",
  "--manufacturer-chart-5": "330 81% 60%",
  "--manufacturer-chart-6": "173 80% 40%",
  "--manufacturer-chart-7": "24 95% 53%",
  "--manufacturer-chart-8": "84 81% 44%",
} as CSSProperties;

const hashSeed = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const randomFromSeed = (seed: string, salt: number) => {
  const hash = hashSeed(`${seed}:${salt}`);
  return hash / 4294967295;
};

const halton = (index: number, base: number) => {
  let result = 0;
  let fraction = 1 / base;
  let current = index;

  while (current > 0) {
    result += fraction * (current % base);
    current = Math.floor(current / base);
    fraction /= base;
  }

  return result;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getManufacturerColorScale = (domain: string[]) =>
  scaleOrdinal<string, string>({
    domain,
    range: manufacturerChartColorTokens,
  });

const getManufacturerColor = (label: string) =>
  manufacturerChartColorTokens[
    hashSeed(`${label}:color`) % manufacturerChartColorTokens.length
  ] ?? manufacturerChartColorTokens[0]!;

export default function generateManufacturerCircles({
  data,
  width,
  height,
}: {
  data: ManufacturerRadialDatum[];
  width: number;
  height: number;
}) {
  if (width < 10 || height < 10 || data.length === 0) {
    return [];
  }

  const isNarrowLayout = width < 640;
  const minDimension = Math.min(width, height);
  const maxValue = Math.max(...data.map((entry) => entry.value), 1);
  const minRadius = isNarrowLayout
    ? Math.max(5, Math.min(minDimension * 0.018, 8))
    : Math.max(8, Math.min(minDimension * 0.028, 12));
  const maxRadius = isNarrowLayout
    ? Math.min(minDimension * 0.155, 54)
    : Math.min(minDimension * 0.19, 78);
  const padding = isNarrowLayout ? 18 : 28;
  const placementOrder = [...data].sort(
    (left, right) =>
      hashSeed(`${left.label}:placement`) - hashSeed(`${right.label}:placement`) ||
      left.label.localeCompare(right.label),
  );
  const circles: RelaxedManufacturerCircle[] = placementOrder.map((entry, index) => {
    const normalizedValue = Math.min(Math.max(entry.value / maxValue, 0), 1);
    const radius = Number(
      (
        minRadius +
        Math.pow(normalizedValue, isNarrowLayout ? 1.42 : 1.35) *
          (maxRadius - minRadius)
      ).toFixed(2),
    );
    const anchorX = clamp(
      padding +
        radius +
        halton(index + 1, 2) * (width - padding * 2 - radius * 2),
      padding + radius,
      width - padding - radius,
    );
    const anchorY = clamp(
      padding +
        radius +
        halton(index + 1, 3) * (height - padding * 2 - radius * 2),
      padding + radius,
      height - padding - radius,
    );
    const x = clamp(
      anchorX + (randomFromSeed(entry.label, 1) - 0.5) * radius * 0.65,
      padding + radius,
      width - padding - radius,
    );
    const y = clamp(
      anchorY + (randomFromSeed(entry.label, 2) - 0.5) * radius * 0.65,
      padding + radius,
      height - padding - radius,
    );
    const color = getManufacturerColor(entry.label);
    const gradientTo =
      manufacturerChartColorTokens[
        (manufacturerChartColorTokens.indexOf(color) + 1) %
          manufacturerChartColorTokens.length
      ] ?? manufacturerChartColorTokens[1]!;

    return {
      ...entry,
      id: entry.label,
      x,
      y,
      radius,
      color,
      gradientTo,
      anchorX,
      anchorY,
    };
  });

  const relaxed = [...circles];
  const overlapFactor = isNarrowLayout ? 0.82 : 0.84;
  const anchorPull = isNarrowLayout ? 0.032 : 0.045;

  for (let iteration = 0; iteration < 120; iteration += 1) {
    for (let index = 0; index < relaxed.length; index += 1) {
      const current = relaxed[index];
      if (!current) {
        continue;
      }

      for (let compareIndex = index + 1; compareIndex < relaxed.length; compareIndex += 1) {
        const other = relaxed[compareIndex];
        if (!other) {
          continue;
        }

        const dx = other.x - current.x;
        const dy = other.y - current.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const minimumDistance = (current.radius + other.radius) * overlapFactor;

        if (distance >= minimumDistance) {
          continue;
        }

        const push = ((minimumDistance - distance) / distance) * 0.5;
        const pushX = dx * push;
        const pushY = dy * push;

        current.x -= pushX;
        current.y -= pushY;
        other.x += pushX;
        other.y += pushY;
      }

      current.x += (current.anchorX - current.x) * anchorPull;
      current.y += (current.anchorY - current.y) * anchorPull;
      current.x = clamp(current.x, padding + current.radius, width - padding - current.radius);
      current.y = clamp(current.y, padding + current.radius, height - padding - current.radius);
    }
  }

  return relaxed.map(({ anchorX: _anchorX, anchorY: _anchorY, ...circle }) => circle);
}
