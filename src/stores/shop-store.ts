import { type Image as ImageType } from "@shopify/hydrogen-react/storefront-api-types";
import { Product } from "@shopify/hydrogen-react/storefront-api-types";
import { create } from 'zustand'

type FeaturedMedia = {
    preview?: {
        image?: ImageType
    }
}


type Operation = 'filter' | 'sort' | 'search'
export type ShopifyProduct = Product & {featuredMedia?: FeaturedMedia}
export type ProductFilterType = 'title' | 'price_range' | 'product_type'
export type ProductSortField = 'title' | 'price' | 'publishedAt' | 'updatedAt'
export type ProductSortDirection = 'ASC' | 'DESC'

type Update = {
    type: Operation
    value: string
    field?: ProductSortField | ProductFilterType
}


interface PostsState {
    posts: ShopifyProduct[]
    operations: Operation[]
    filters: string[]
    direction: ProductSortDirection
    field: ProductSortField
    query: string
    update: (operation: Update) => void
}



const filterProductsByTitle = ({
    products,
    query,
}: {
    products: ShopifyProduct[]
    query: string,
    
}) => {

    const searchTerm = query.toLowerCase()
    const filtered = query.length > 0 ? products.filter(product => product.title.toLowerCase().includes(searchTerm)) : products
    
    return {
        products: filtered,
        query: query ?? ''
    }
}

const filterProductsByType = ({
    products,
    filters,
}: {
    products: ShopifyProduct[]
    filters: string[],
    
}) => {

    const filtered = filters.length > 0 ? products.filter(product => filters.filter(
        filter => product.productType.includes(filter)
    ).length > 0) : products

    return {
        products: filtered,
        filters: filters
    }
}

const filterProductsByPrice = ({
    products,
    minimum,
    maximum
}: {
    products: ShopifyProduct[]
    minimum: number,
    maximum: number,
    
}) => {

    const filtered = products.filter(
        product => product.variants.edges.map(
            variant => parseFloat(variant.node.price as unknown as string) >= minimum 
            && parseFloat(variant.node.price as unknown as string) <= maximum
        )
    )

    return {
        products: filtered,
        minimum: minimum,
        maximum: maximum,
    }
}


const filterProduct = ({
    products,
    filters,
    query,
    minimum,
    maximum,
    filterType,

}: {
    products: ShopifyProduct[],
    filters: string[]
    query: string,
    minimum: number,
    maximum: number,
    filterType: ProductFilterType
}) => {

    switch (filterType) {
        case 'title':
            return filterProductsByTitle({
                products,
                query,
            })

        case 'product_type':
            return filterProductsByType({
                products,
                filters,
            })

        case 'price_range':
            return filterProductsByPrice({
                products,
                minimum,
                maximum,
            })
        
        default:
            return products
    }

}

const getProductMaximumPrice = (product: Product) => {
    const maximumPriceVariant = product.variants.edges.map(variant => variant.node)
        .reduce((max, variant) => {
            const price = parseFloat(variant.price as unknown as string);
            const maxPrice = parseFloat(max.price as unknown as string);

            return maxPrice < price ? variant : max
            

        })

    return parseFloat(maximumPriceVariant.price as unknown as string)

}


const sortProduct = (productA: Product, productB: Product, field: ProductSortField) => {
    switch (field) {
        case 'title':
            return productA.title.localeCompare(productB.title)
        case 'price':
            return getProductMaximumPrice(productA) < getProductMaximumPrice(productB)

        case 'publishedAt':
        case 'updatedAt':
        default:
            return 0
    }

}
