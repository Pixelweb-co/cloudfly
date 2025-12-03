'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import CategoriesListTable from './CategoriesListTable'
import type { CategoryType } from '@/types/apps/categoryType'
import { Card } from '@mui/material'

const CategoryList = ({ reload, categoryData }: { reload: any; categoryData: CategoryType[] }) => {

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <CategoriesListTable tableData={categoryData} reload={reload} />
      </Grid>
    </Grid>
  )
}

export default CategoryList
