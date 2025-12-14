import { useContext } from "react"
import { useStore } from "zustand"
import { CartStoreContext } from "~/components/cart/cart-provider"
import { useShallow } from "zustand/react/shallow"
import { type CartStore } from "~/lib/stores/shopping-cart"


// Hook to use the store with a selector
export function useCart<T>(selector: (state: CartStore) => T): T {
  const store = useContext(CartStoreContext)
  if (!store) {
    throw new Error("useCartStore must be used within a CartStoreProvider")
  }
  return useStore(store, selector)
}

// Selector hooks for optimized re-renders
export const useCartItems = () => useCart(useShallow((state) => state.items))
export const useCartSubtotal = () => useCart((state) => state.subtotal)
export const useCartDiscount = () => useCart((state) => state.discount)
export const useCartDiscountPercentage = () => useCart((state) => state.discountPercentage)
export const useCartTotal = () => useCart((state) => state.total)
export const useCartItemCount = () => useCart((state) => state.items.length)
export const useCartAppliedDiscounts = () => useCart((state) => state.appliedDiscounts)
export const useCartPricingData = () => useCart(useShallow((state) => state.pricingData))
export const useCartActions = () =>
  useCart(useShallow((state) => ({
  addQuote: state.addQuote,
  addProduct: state.addProduct,
  removeItem: state.removeItem,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
  recalculateTotals: state.recalculateTotals,
})))