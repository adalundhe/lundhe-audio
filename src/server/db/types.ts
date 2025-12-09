export type EquipmentItem = {
    id: string
    name: string
    description: string
    type: string
    group: string
    manufacturer: string
    quantity: number
    created_timestamp: string
    updated_timestamp: string | null
}


// Infer types from schema
export type Product = {
    id: string
    name: string
    description: string | null
    productType: 'mixing' | 'mastering'
    price: number
}

export type ProductOption = {
    id: string
    name: string
    description: string | null
    price: number
    category: "addon" | "delivery" | "track_fee" | "length_fee"
    priceType: "flat" | "per_ten_tracks" | "multiplier" | "per_hour"
    productType: 'mixing' | 'mastering'
    minThreshold: number | null
    maxThreshold: number | null
}


export type Discount = {
    id: string
    name: string
    description: string | null
    discountPercentage: number
    category: "volume" | "option_volume" | "production" | "bundle"
    productType: 'mixing' | 'mastering'
    minThreshold: number | null
    maxThreshold: number | null

}