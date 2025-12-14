import { createStore } from "zustand"
import { persist } from "zustand/middleware"
import type { QuoteData } from "~/lib/mixing/pricing-types"
import type { MasteringQuoteData } from "~/lib/mastering/pricing-types"
import { Discount, PricingData } from "~/server/db/types"
import { useShallow } from "zustand/react/shallow"

export type CartItemType = "mixing" | "mastering" | "product"

interface BaseCartItem {
  id: string
  name: string
  addedAt: number
}

export interface QuoteCartItem extends BaseCartItem {
  type: "mixing" | "mastering"
  quote: QuoteData | MasteringQuoteData
}

export interface ProductCartItem extends BaseCartItem {
  type: "product"
  price: number
  quantity: number
}

export type CartItem = QuoteCartItem | ProductCartItem

// Type guards
export function isQuoteItem(item: CartItem): item is QuoteCartItem {
  return item.type === "mixing" || item.type === "mastering"
}

export function isProductItem(item: CartItem): item is ProductCartItem {
  return item.type === "product"
}



export interface AppliedDiscount {
  id: string
  name: string
  percentage: number
  amount: number
  count: number
  description: string
}

export interface CartState {
  items: CartItem[]
  subtotal: number
  discount: number
  appliedDiscounts: AppliedDiscount[]
  discountPercentage: number
  discountName: string | null
  total: number
  discountData: Discount[]
  pricingData: PricingData
}

export interface CartActions {
  addQuote: (type: "mixing" | "mastering", name: string, quote: QuoteData | MasteringQuoteData) => void
  addProduct: (name: string, price: number, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  recalculateTotals: () => void
}

export type CartStore = CartState & CartActions
export type CartStoreApi = ReturnType<typeof createCartStore>

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getItemTotal(item: CartItem): number {
  if (isQuoteItem(item)) {
    return item.quote.costs.total
  }
  return item.price * item.quantity
}

function calculateTotals(
  items: CartItem[],
  discountData: Discount[],
): Pick<CartState, "subtotal" | "discount" | "discountPercentage" | "discountName" | "appliedDiscounts" | "total"> {
  const subtotal = items.reduce((sum, item) => sum + getItemTotal(item), 0)

  const appliedDiscounts: AppliedDiscount[] = []

  const mixAndMasterBundle = discountData.find(d => d.id === "mix_and_master_bundle")

  const mixingQuotes = items.filter((item) => item.type === "mixing") as QuoteCartItem[]
  const masteringQuotes = items.filter((item) => item.type === "mastering") as QuoteCartItem[]

  // Number of complete bundles is the minimum of mixing and mastering quote counts
  const bundleCount = Math.min(mixingQuotes.length, masteringQuotes.length)
  const hasBundleDiscount = bundleCount > 0 && mixAndMasterBundle

  if (hasBundleDiscount && mixAndMasterBundle) {
    // Sort quotes by price descending so we bundle the most expensive ones first
    const sortedMixing = [...mixingQuotes].sort((a, b) => b.quote.costs.total - a.quote.costs.total)
    const sortedMastering = [...masteringQuotes].sort((a, b) => b.quote.costs.total - a.quote.costs.total)

    // Calculate discount only on the paired quotes
    let bundledTotal = 0
    sortedMixing.forEach((mix, idx) => {
      if (idx < bundleCount) {
        bundledTotal += mix.quote.costs.total
      }

    })


    sortedMastering.forEach((mix, idx) => {
      if (idx < bundleCount) {
        bundledTotal += mix.quote.costs.total
      }

    })
    const amount = bundledTotal * (mixAndMasterBundle.discountPercentage / 100)
    appliedDiscounts.push({
      id: mixAndMasterBundle.id,
      name: mixAndMasterBundle.name,
      percentage: mixAndMasterBundle.discountPercentage,
      amount,
      count: bundleCount,
      description: mixAndMasterBundle.description as string,
    })
  }

  // Calculate totals from all applied discounts
  const discount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0)
  const discountPercentage = hasBundleDiscount ? mixAndMasterBundle!.discountPercentage : 0
  const discountName = hasBundleDiscount ? mixAndMasterBundle!.name : null
  const total = subtotal - discount

  return { subtotal, discount, discountPercentage, discountName, appliedDiscounts, total }
}

export function createCartStore(pricingData: PricingData) {
  const initialState: CartState = {
    items: [],
    subtotal: 0,
    discount: 0,
    discountPercentage: 0,
    appliedDiscounts: [],
    discountName: null,
    total: 0,
    discountData: pricingData.discounts.filter(d => d.category === "cart_bundle"),
    pricingData,
  }

  return createStore<CartStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        addQuote: (type, name, quote) => {
          const newItem: QuoteCartItem = {
            id: generateId(),
            type,
            name,
            quote,
            addedAt: Date.now(),
          }

          const newItems = [...get().items, newItem]
          const totals = calculateTotals(newItems, get().discountData)

          set({
            items: newItems,
            ...totals,
          })
        },

        addProduct: (name, price, quantity = 1) => {
          const newItem: ProductCartItem = {
            id: generateId(),
            type: "product",
            name,
            price,
            quantity,
            addedAt: Date.now(),
          }

          const newItems = [...get().items, newItem]
          const totals = calculateTotals(newItems, get().discountData)

          set({
            items: newItems,
            ...totals,
          })
        },

        removeItem: (id) => {
          const newItems = get().items.filter((item) => item.id !== id)
          const totals = calculateTotals(newItems, get().discountData)

          set({
            items: newItems,
            ...totals,
          })
        },

        updateQuantity: (id, quantity) => {
          const items = get().items
          const itemIndex = items.findIndex((item) => item.id === id)

          if (itemIndex === -1) return

          const item = items[itemIndex]
        
          if (!item) return
          // Only product items have quantity
          if (!isProductItem(item)) return

          // Remove item if quantity is 0 or less
          if (quantity <= 0) {
            get().removeItem(id)
            return
          }

          const newItems = [...items]
          newItems[itemIndex] = { ...item, quantity }
          const totals = calculateTotals(newItems, get().discountData)

          set({
            items: newItems,
            ...totals,
          })
        },

        clearCart: () => {
          set({
            items: [],
            subtotal: 0,
            discount: 0,
            discountPercentage: 0,
            appliedDiscounts: [],
            discountName: null,
            total: 0,
          })
        },

        recalculateTotals: () => {
          const totals = calculateTotals(get().items, get().discountData)
          set(totals)
        },
      }),
      {
        name: "cart-storage",
        partialize: (state) => ({
          items: state.items,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            const totals = calculateTotals(state.items, state.discountData)
            state.subtotal = totals.subtotal
            state.discount = totals.discount
            state.discountPercentage = totals.discountPercentage
            state.discountName = totals.discountName,
            state.appliedDiscounts = totals.appliedDiscounts
            state.total = totals.total
          }
        },
      },
    ),
  )
}
