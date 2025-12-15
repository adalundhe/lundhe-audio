import { createStore } from "zustand"
import { persist } from "zustand/middleware"
import type { QuoteData } from "~/lib/mixing/pricing-types"
import type { MasteringQuoteData } from "~/lib/mastering/pricing-types"
import { Discount, PricingData } from "~/server/db/types"

export type CartItemType = "mixing" | "mastering" | "product"

interface BaseCartItem {
  id: string
  name: string
  addedAt: number
}

export interface QuoteCartItem extends BaseCartItem {
  type: "mixing" | "mastering"
  quote: QuoteData | MasteringQuoteData
  price: number
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


export type CartInitData = Omit<CartState, "discountData" | "pricingData">

type SubmitAction =(item: CartItem[], totals: Pick<CartState, "subtotal" | "discount" | "appliedDiscounts" | "total">) => Promise<void>

export interface AppliedDiscount {
  id: string
  name: string
  percentage: number
  amount: number
  count: number
  description: string
  addedAt: number
  items: string[]
}

export interface CartState {
  cartId?: string
  userId?: string,
  items: CartItem[]
  subtotal: number
  discount: number
  appliedDiscounts: AppliedDiscount[]
  total: number
  discountData: Discount[]
  pricingData: PricingData
}

export interface CartActions {
  addQuote: (item: {type: "mixing" | "mastering", name: string, quote: QuoteData | MasteringQuoteData, submit: SubmitAction}) => void
  addProduct: (item: {name: string, price: number, quantity?: number,  submit: SubmitAction}) => void
  removeItem: (id: string, submit: SubmitAction) => void
  updateQuantity: (id: string, quantity: number, submit: SubmitAction) => void
  clearCart: ( submit: SubmitAction ) => void
  recalculateTotals: () => void
  clearCartIdentifiers: () => void
  setUserId: (id: string) => void
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
): Pick<CartState, "subtotal" | "discount"  | "appliedDiscounts" | "total"> {
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
    const appliedMixingQuoteCartIds: string[] = []
    sortedMixing.forEach((mix, idx) => {
      if (idx < bundleCount) {
        bundledTotal += mix.quote.costs.total
        appliedMixingQuoteCartIds.push(mix.id)
      }

    })


    const appliedMasteringQuoteCartIds: string[] = []
    sortedMastering.forEach((master, idx) => {
      if (idx < bundleCount) {
        bundledTotal += master.quote.costs.total
        appliedMasteringQuoteCartIds.push(master.id)
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
      addedAt: Date.now(),
      items: [
        ...appliedMixingQuoteCartIds,
        ...appliedMasteringQuoteCartIds,
      ]
    })
  }

  // Calculate totals from all applied discounts
  const discount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0)
  const total = subtotal - discount

  return { subtotal, discount, appliedDiscounts, total }
}

export function createCartStore(pricingData: PricingData, initCart?: CartInitData) {

  return createStore<CartStore>()(
    persist(
      (set, get) => ({
        ...Object.assign({
            items: [],
            subtotal: 0,
            discount: 0,
            appliedDiscounts: [],
            total: 0,
            discountData: pricingData.discounts.filter(d => d.category === "cart_bundle"),
            pricingData,
            cartId: crypto.randomUUID()
          }, initCart ?? {}),

        addQuote: ({type, name, quote, submit}) => {
          const newItem: QuoteCartItem = {
            id: generateId(),
            type,
            name,
            quote,
            addedAt: Date.now(),
            price: quote.costs.total,
          }

          const newItems = [...get().items, newItem]
          const totals = calculateTotals(newItems, get().discountData)
          submit([newItem], totals)

          set({
            items: newItems,
            ...totals,
          })

        },

        addProduct: ({name, price, quantity = 1, submit}) => {
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

          submit(newItems, totals)
        },

        removeItem: (id, submit) => {

          const { items } = get()
          const newItems = items.filter((item) => item.id !== id)
          const totals = calculateTotals(newItems, get().discountData)

          submit(items.filter(item => item.id === id), totals)

          set({
            items: newItems,
            ...totals,
          })
        },

        updateQuantity: (id, quantity, submit) => {
          const items = get().items
          const itemIndex = items.findIndex((item) => item.id === id)

          if (itemIndex === -1) return

          const item = items[itemIndex]
        
          if (!item) return
          // Only product items have quantity
          if (!isProductItem(item)) return

          const newItems = [...items]
          newItems[itemIndex] = { ...item, quantity }
          const totals = calculateTotals(newItems, get().discountData)
          submit(newItems, totals)

          set({
            items: newItems,
            ...totals,
          })
        },

        clearCart: (submit: SubmitAction) => {

          submit([], {
            subtotal: 0,
            discount: 0,
            appliedDiscounts: [],
            total: 0,
          })
          
          set({
            items: [],
            subtotal: 0,
            discount: 0,
            appliedDiscounts: [],
            total: 0,
          })
        },

        recalculateTotals: () => {
          const totals = calculateTotals(get().items, get().discountData)
          set(totals)
        },

        clearCartIdentifiers: () => {
          set({ cartId: undefined, userId: undefined })
        },
        setUserId: (id: string) => set({ userId: id })
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
            state.appliedDiscounts = totals.appliedDiscounts
            state.total = totals.total
          }
        },
      },
    ),
  )
}
