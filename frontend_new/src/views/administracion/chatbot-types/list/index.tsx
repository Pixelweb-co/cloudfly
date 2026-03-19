'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChannelTypesListTable from './ChatbotTypesListTable'

const ChannelTypeList = ({ channelTypeData, reload }: any) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <ChannelTypesListTable tableData={channelTypeData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default ChatbotTypeList
