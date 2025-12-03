'use client'

import Grid from '@mui/material/Grid'
import QuotesListTable from './QuotesListTable'
import type { QuoteType } from '@/types/apps/quoteType'

const QuotesList = ({ reload, quotesData }: { reload: any; quotesData: QuoteType[] }) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <QuotesListTable tableData={quotesData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default QuotesList
