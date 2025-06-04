import { ProductPage } from "~/server/api/routers/shop";
import { ShopProductCard } from "./ShopProductCard";


export const ShopProductPage = ({
    page
}: {
    page: ProductPage
}) => <div className="flex justify-center w-full h-full mt-4">
    <div className="grid grid-cols-products grid-rows-products flex justify-center w-full h-fit">
        {
            page.products.map(
                product => <div key={`shop-product-${product.id}`} className="w-full flex items-center justify-center">
                    <ShopProductCard product={product}/>
                </div>

            )
        }
    </div>
</div>