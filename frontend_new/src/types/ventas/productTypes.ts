export interface Product {
  id: number;
  tenantId: number;
  productName: string;
  description: string;
  productType: string;
  price: number;
  salePrice?: number;
  sku?: string;
  barcode?: string;
  manageStock?: boolean;
  inventoryStatus?: string;
  allowBackorders?: string;
  inventoryQty?: number;
  soldIndividually?: boolean;
  weight?: number;
  dimensions?: string;
  upsellProducts?: string;
  crossSellProducts?: string;
  status: string;
  brand?: string;
  model?: string;
  categoryIds?: number[];
  imageUrls?: string[]; // Para la visualización frontend
}

export interface ProductCreateRequest extends Omit<Product, 'id'> {
  id?: number;
}
