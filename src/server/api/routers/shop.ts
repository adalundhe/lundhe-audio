import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { type PageInfo, type Product, type ProductEdge } from "@shopify/hydrogen-react/storefront-api-types";



export type Prodcuts = {
    products: {
        edges: ProductEdge[]
        pageInfo: PageInfo
    }
}

export type ProductPage = {
    products: Product[]
    variantCursors: string[]
    pageInfo?: PageInfo
    error?: string
}


export const shopRouter = createTRPCRouter({
    getProducts: publicProcedure
    .input(z.object({
        cursor: z.string().optional(),
        variantsCursor: z.string().optional(),
        limit: z.number().gte(1).default(10),
        variantsLimit: z.number().gte(1).default(10),
        sort: z.enum([ 'title', 'product_type', 'published_at', 'updated_at' ]).default("title")
    }))
    .query(async ({ ctx, input }) => {
        const response = await ctx.shopify.request<Prodcuts>(
            `query ProductQuery ($sortKey: ProductSortKeys!, $limit: Int!, $variants: Int!, $cursor: String, $variantsCursor: String) {
                    products (sortKey: $sortKey, first: $limit, after: $cursor) {
                    edges{
                        node {
                            id
                            title
                            description
                            productType
                            publishedAt
                            updatedAt
                            featuredMedia {
                                id
                                alt
                                mediaContentType
                                status
                                preview {
                                    image {
                                        url,
                                        altText,
                                    }
                                }
                            }
                            variants(first: $variants, after: $variantsCursor) {
                                edges {
                                    node {
                                        id
                                        title
                                        displayName
                                        position
                                        price
                                    }
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                    endCursor
                                    startCursor               
                                }
                            }
                        }
                    }
                    pageInfo {
                        hasNextPage
                        hasPreviousPage
                        endCursor
                        startCursor
                    }
                }
            }`,
            {
                variables: {
                    limit: input.limit,
                    sortKey: input.sort.toLocaleUpperCase(),
                    variants: input.variantsLimit,
                    cursor: input.cursor,
                    variantsCursor: input.variantsCursor,
                }
            }
        )
        

        return {
            products: response.data?.products.edges.map(edge => edge.node) ?? [] as Prodcuts[],
            variantCursors: response.data?.products.edges.map(edge => edge.cursor) ?? [] as string[],
            pageInfo: response.data?.products.pageInfo,
            error: response.errors?.message
        } as ProductPage
    })
})