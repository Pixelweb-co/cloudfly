'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChatbotTypesListTable from './ChatbotTypesListTable'

const ChatbotTypeList = ({ chatbotTypeData, reload }: any) => {
    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <ChatbotTypesListTable tableData={chatbotTypeData} reload={reload} />
            </Grid>
        </Grid>
    )
}

export default ChatbotTypeList
