import { useEffect, useState } from "react";
import { api } from "~/utils/api";

export default function Shop() {

    const {data} = api.shop.getProducts.useQuery({})

    const [shop, setShop] = useState<typeof data>(data)

    console.log(shop?.errors?.graphQLErrors, shop?.data)

    useEffect(() => {
        setShop(data)
    }, [data])

    return (
        <div>Hi! I got {shop?.errors?.message}</div>
    )

}