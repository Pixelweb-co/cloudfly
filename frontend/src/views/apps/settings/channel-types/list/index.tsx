'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChatbotTypeList from './ChatbotTypeList'

const ChannelTypeList = ({ tableData, reload }: any) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <ChatbotTypeList tableData={tableData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default ChannelTypeList
