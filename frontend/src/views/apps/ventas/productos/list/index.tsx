'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ProductsListTable from './ProductsListTable'
import type { ProductType } from '@/types/apps/productType'

const ProductList = ({ reload, productData }: { reload: any; productData: ProductType[] }) => {

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ProductsListTable tableData={productData} reload={reload} />
      </Grid>
    </Grid>
  )
}

export default ProductList
