import { api } from "~/utils/api";
import { useCart } from "@shopify/hydrogen-react";
import { Button } from "~/components//ui/button";
import {
    type CartLine,
 } from "@shopify/hydrogen-react/storefront-api-types";


export const ProductSubmitButton = ({
    itemId,
    quantity,
    cartItem,
    updateQuantity,
}: {
    itemId: string,
    quantity: number,
    cartItem?: CartLine
    updateQuantity: (quantity: number) => void
}) => {

    const addMutation = api.shop.addToCart.useMutation()
    const updateMutation = api.shop.updateCart.useMutation()
    const { id } = useCart()

    const mutate = () => {
        if (id && cartItem) {
            updateMutation.mutate({
                cartId: id,
                lines: [
                    {
                        id: cartItem.id,
                        merchandiseId: itemId,
                        quantity: quantity,
                        sellingPlanId: cartItem.sellingPlanAllocation?.sellingPlan.id
                    }
                ]
            })

            
            return updateQuantity(quantity)
        }

        id && addMutation.mutate({
                cartId: id,
                lines: [
                    {
                        merchandiseId: itemId,
                        quantity: quantity,
                    }
                ]
            }) 

        return id && updateQuantity(quantity)
    }

    return (
        <Button className="border rounded-sm h-[42px] w-[300px] hover:bg-black/15 dark:hover:bg-white/15 hover:underline"
            onClick={() => {
                mutate()
            }}
        >
            Add to Cart
        </Button>
    )
}