'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import CustomerListTable from './CustomerListTable'
import CustomerListCards from './CustomerListCards'

const CustomerList = ({ reload, customerData }: any) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <CustomerListCards />
            </Grid>
            <Grid item xs={12}>
                <CustomerListTable tableData={customerData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default CustomerList
