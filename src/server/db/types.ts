export type EquipmentItem = {
    id: string
    name: string
    description: string
    type: string
    group: string
    status: "active" | "inactive" | "out-of-order"
    price: number
    manufacturer: string
    quantity: number
    location: string
    serialNumber: string
    acquiredFrom: string
    purchaseDate: string
    purchaseSource: string
    referenceNumber: string
    room: string
    rack: string
    shelf: string
    slot: string
    storageCase: string
    notes: string
    created_timestamp: string
    updated_timestamp: string | null
}

export type EquipmentItemMediaAsset = {
    id: string
    equipmentItemId: string
    assetType: "photo" | "document"
    fileName: string
    contentType: string
    byteSize: number
    storageUri: string
    createdTimestamp: string
    updatedTimestamp: string | null
}

export type WishlistGearItem = {
    id: string
    name: string
    description: string
    type: string
    group: string
    status: "researching" | "watching" | "ready-to-buy"
    targetPrice: number
    quantity: number
    manufacturer: string
    notes: string
    created_timestamp: string
    updated_timestamp: string | null
}


// Infer types from schema
export type Product = {
    id: string
    name: string
    description: string | null
    productType: 'mixing' | 'mastering' | "mixing-and-mastering"
    price: number
}

export type ProductOption = {
    id: string
    name: string
    description: string | null
    price: number
    category: "addon" | "delivery" | "track_fee" | "length_fee"
    priceType: "flat" | "per_ten_tracks" | "multiplier" | "per_hour"
    productType: 'mixing' | 'mastering' | "mixing-and-mastering"
    perCount: number
    minThreshold: number | null
    maxThreshold: number | null
}


export type Discount = {
    id: string
    name: string
    description: string | null
    discountPercentage: number
    category: "volume" | "option_volume" | "production" | "bundle" | "delivery_bundle" | "cart_bundle"
    productType: 'mixing' | 'mastering' | "mixing-and-mastering"
    minThreshold: number | null
    maxThreshold: number | null

}

export type PricingData = {
    products: Product[]
    discounts: Discount[]
    options: ProductOption[]
}
