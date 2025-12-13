import { useContext } from "react"
import { useStore } from "zustand"
import { CartStoreContext } from "~/components/cart/cart-provider"
import { useShallow } from "zustand/react/shallow"
import { type CartStore } from "~/lib/stores/shopping-cart"


// Hook to use the store with a selector
export function useCartStore<T>(selector: (state: CartStore) => T): T {
  const store = useContext(CartStoreContext)
  if (!store) {
    throw new Error("useCartStore must be used within a CartStoreProvider")
  }
  return useStore(store, selector)
}

// Selector hooks for optimized re-renders
export const useCartItems = () => useCartStore(useShallow((state) => state.items))
export const useCartSubtotal = () => useCartStore((state) => state.subtotal)
export const useCartDiscount = () => useCartStore((state) => state.discount)
export const useCartDiscountPercentage = () => useCartStore((state) => state.discountPercentage)
export const useCartTotal = () => useCartStore((state) => state.total)
export const useCartItemCount = () => useCartStore((state) => state.items.length)
export const useCartAppliedDiscounts = () => useCartStore((state) => state.appliedDiscounts)
export const useCartActions = () =>
  useCartStore(useShallow((state) => ({
  addQuote: state.addQuote,
  addProduct: state.addProduct,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  recalculateTotals: state.recalculateTotals,
})))