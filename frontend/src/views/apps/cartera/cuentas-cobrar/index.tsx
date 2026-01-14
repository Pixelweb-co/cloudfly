'use client'

import Grid from '@mui/material/Grid'
import ReceivablesListTable from './ReceivablesListTable'
import type { PortfolioDocument } from '@/types/portfolio'

const ReceivablesList = ({ reload, tableData }: { reload: () => void; tableData: PortfolioDocument[] }) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <ReceivablesListTable tableData={tableData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default ReceivablesList
