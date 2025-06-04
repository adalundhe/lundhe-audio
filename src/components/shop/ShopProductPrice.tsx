
import { useMemo } from "react";
import { ShopProductVariantPrice } from "./ShopProductVariantPrice";
import { ProductVariantEdge } from '@shopify/hydrogen-react/storefront-api-types';


export const ShopProductPrice = ({
    variants
}: {
    variants: ProductVariantEdge[]
}) => {

     const firstVariant = useMemo(() => variants.map(variant => variant.node).reduce((min, variant) => {
            const price = parseFloat(variant.price as unknown as string);
            const minPrice = parseFloat(min.price as unknown as string);
    
            return price < minPrice ? variant : min
            
    
        }), [variants])
    
        const lastVariant = useMemo(() => variants.map(variant => variant.node).reduce((max, variant) => {
            const price = parseFloat(variant.price as unknown as string);
            const maxPrice = parseFloat(max.price as unknown as string);
    
            return maxPrice < price ? variant : max
            
    
        }), [variants])

    return (
        <div>
            {
                firstVariant && lastVariant && firstVariant.price != lastVariant.price
                ?
                <div className="flex gap-2">
                    {
                        firstVariant && <ShopProductVariantPrice variant={firstVariant} />
                    }
                    <p>-</p>
                    {
                        lastVariant && <ShopProductVariantPrice variant={lastVariant} />
                    }
                </div>
                :
                <div>
                    {
                        firstVariant && <ShopProductVariantPrice variant={firstVariant} />
                    }
                </div>
            }
        </div>
    )
}