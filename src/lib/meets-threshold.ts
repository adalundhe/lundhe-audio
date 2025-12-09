import type { Product, ProductOption, Discount } from "~/server/db/schema"

// Re-export types for convenience
export type { Product, ProductOption, Discount }

// Helper to check if a value meets threshold requirements (client-safe - no db access)
export function meetsThreshold(value: number, minThreshold: number | null, maxThreshold: number | null): boolean {
  if (minThreshold !== null && value < minThreshold) return false
  if (maxThreshold !== null && value > maxThreshold) return false
  return true
}
