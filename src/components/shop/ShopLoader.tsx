import { api } from "~/utils/api";
import { ShopProductPage } from "./ShopProductPage";
import { Layout } from "~/components/Layout";


export const ShopLoader = () => {
    
    const [data] = api.shop.getProducts.useSuspenseInfiniteQuery({
        limit: 10,
    }, 
    {
      getNextPageParam: (lastPage) => lastPage.pageInfo?.hasNextPage ? lastPage.pageInfo.endCursor : null,
      getPreviousPageParam: (priorPage) => priorPage.pageInfo?.hasPreviousPage ? priorPage.pageInfo.startCursor : null
      // initialCursor: 1, // <-- optional you can pass an initialCursor
    },)
    return (
        <>
            <Layout>
                <div className="w-3/4">
                    {
                        data.pages.map(
                            (page, idx) => <ShopProductPage key={`shop-page-${idx}`} page={page} />
                        )
                    }
                </div>
            </Layout>
        </>
    )

}