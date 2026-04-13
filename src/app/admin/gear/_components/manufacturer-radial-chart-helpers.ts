"use client";

export interface ManufacturerRadialDatum {
  label: string;
  value: number;
  totalQuantity: number;
  uniqueItemCount: number;
}

export function buildManufacturerRadialData<T>({
  items,
  getManufacturer,
  getValue,
  getQuantity,
  normalizeManufacturer,
}: {
  items: T[];
  getManufacturer: (item: T) => string;
  getValue: (item: T) => number;
  getQuantity: (item: T) => number;
  normalizeManufacturer: (value: string) => string;
}) {
  const manufacturers = new Map<string, ManufacturerRadialDatum>();

  for (const item of items) {
    const rawManufacturer = getManufacturer(item).trim();
    const label = rawManufacturer || "Unknown";
    const key = normalizeManufacturer(label);
    const value = getValue(item);
    const quantity = getQuantity(item);

    const current =
      manufacturers.get(key) ?? {
        label,
        value: 0,
        totalQuantity: 0,
        uniqueItemCount: 0,
      };

    current.value += value;
    current.totalQuantity += quantity;
    current.uniqueItemCount += 1;

    manufacturers.set(key, current);
  }

  return [...manufacturers.values()]
    .map((entry) => ({
      ...entry,
      value: Number(entry.value.toFixed(2)),
    }))
    .sort((left, right) =>
      right.value - left.value || left.label.localeCompare(right.label),
    );
}
