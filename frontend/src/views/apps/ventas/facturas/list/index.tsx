'use client'

import Grid from '@mui/material/Grid'
import InvoicesListTable from './InvoicesListTable'
import type { InvoiceType } from '@/types/apps/invoiceType'

const InvoicesList = ({ reload, invoicesData }: { reload: any; invoicesData: InvoiceType[] }) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <InvoicesListTable tableData={invoicesData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default InvoicesList
