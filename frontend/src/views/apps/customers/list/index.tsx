'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { CustomersType } from '@/types/apps/customerType'

// Component Imports
import CustomerListTable from './CustomerListTable'

const CustomerList = ({ reload, customerData }: any) => {
  console.log('customerData', customerData)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <CustomerListTable tableData={customerData} reload={reload} />
      </Grid>
    </Grid>
  )
}

export default CustomerList
