// src/types/apps/productType.ts

export type ProductType = {
  image: string | undefined
  id: number
  tenantId: number

  productName: string
  description: string
  productType: string // '0' | '1' | '2' | '3' | '4' | '5'

  price: number
  salePrice: number | null

  sku: string
  barcode: string

  manageStock: boolean
  inventoryStatus: 'IN_STOCK' | 'OUT_OF_STOCK' | 'ON_BACKORDER'
  allowBackorders: 'NO' | 'ALLOW' | 'ALLOW_NOTIFY'
  inventoryQty: number | null
  soldIndividually: boolean

  weight: number | null
  dimensions: string

  upsellProducts: string
  crossSellProducts: string

  status: 'ACTIVE' | 'INACTIVE'
  brand: string
  model: string

  // lo que realmente te manda el backend
  categoryIds: number[]
  imageIds: number[]

  createdAt: string
  updatedAt: string
}
