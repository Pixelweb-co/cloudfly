// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { TypeServiceType } from '@/views/apps/typeService/type/typeServiceType'

// Component Imports
import TypeServiceListTable from './TypeServiceListTable'

const TypeServiceList = ({ TypeServiceData, reload }: { TypeServiceData?: TypeServiceType[], reload:void }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TypeServiceListTable tableData={TypeServiceData} reload={reload}/>
      </Grid>
    </Grid>
  )
}

export default TypeServiceList
