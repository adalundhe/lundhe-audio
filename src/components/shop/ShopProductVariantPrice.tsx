
import {Image, Money, ProductPrice, useMoney} from '@shopify/hydrogen-react';
import { ProductVariant } from '@shopify/hydrogen-react/storefront-api-types';

export const ShopProductVariantPrice = ({
    variant
}: {
    variant: ProductVariant
}) => {

    const priceInfo = useMoney({
        amount: variant.price as unknown as string,
        currencyCode: 'USD'
    })

    return (
        <div className='text-cyan-500'>
            <Money data={priceInfo} />
        </div>
    )
}