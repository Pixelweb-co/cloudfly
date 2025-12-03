'use client'

import Grid from '@mui/material/Grid'
import OrdersListTable from './OrdersListTable'
import type { OrderType } from '@/views/apps/pos/types'

const OrdersList = ({ reload, ordersData }: { reload: any; ordersData: OrderType[] }) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <OrdersListTable tableData={ordersData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default OrdersList
