import { Suspense } from "react";
import { ShopLoader } from "~/components/shop/ShopLoader";

export default function Shop() {

    return (
        <Suspense>
            <ShopLoader/>
        </Suspense>
    )

}