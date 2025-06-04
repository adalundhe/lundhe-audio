import { Card } from "~/components/ui/card";
import {Image} from '@shopify/hydrogen-react';
import { ShopProductPrice } from "./ShopProductPrice";
import { ShopifyProduct } from "~/stores/shop-store";


export const ShopProductCard = ({
    product
}: {
    product: ShopifyProduct
}) => {


    return (
        <Card className="w-full h-full flex flex-col items-center space-y-2 py-8 mx-4 mb-4 border-none shadow-none hover:shadow-md dark:hover:shadow-slate-700/50 hover:border rounded-none transition-all motion-reduce:transition-none duration-700 hover:scale-105 motion-reduce:hover:scale-100">
            <div className="w-[200px] h-[250px]">
                {
                product.featuredMedia?.preview?.image &&
                <Image 
                    loader={() => product.featuredMedia?.preview?.image?.url ?? ""}
                    data={product.featuredMedia.preview.image}
                    width={200}
                    height={300}
                    sizes="50vw 100vw"
                    aspectRatio="4/5"
                    alt={product.featuredMedia.preview.image.altText ?? product.description}
                />
            }
            </div>
            <h1 className="text-center mb-4 underline">
                <b>{product.title}</b>
            </h1>
            <p className="text-center text-md">{product.description.length === 0 ? "No description" : product.description}</p>
            <ShopProductPrice variants={product.variants.edges} />
        </Card>
    )
}