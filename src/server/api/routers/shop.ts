import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { equipmentItem } from "~/server/db/schema"
import { shopifyFetch } from "./shopify";

export type EquipmentItem = {
    id: string
    name: string
    description: string
    type: string
    group: string
    quantity: number
    created_timestamp: string
    updated_timestamp: string | null
}


export const shopRouter = createTRPCRouter({
    getProducts: publicProcedure
    .input(z.object({
        productsCursor: z.string().optional(),
        variantsCursor: z.string().optional(),
        limit: z.number().gte(1).default(10),
        variantsLimit: z.number().gte(1).default(10),
        sort: z.enum([ 'title', 'product_type', 'published_at', 'updated_at' ]).default("title")
    }))
    .query(async ({ ctx, input }) => {
        return await ctx.shopify.request(
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
                    cursor: input.productsCursor,
                    variantsCursor: input.variantsCursor,
                }
            }
        )
        

    })
})