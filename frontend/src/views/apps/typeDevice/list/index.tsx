// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { TypeDeviceType } from '../type/typeDeviceType'

// Component Imports
import TypeDeviceListTable from './TypeDeviceListTable'

const typeDeviceList = ({ typeDeviceData, reload }: { typeDeviceData?: TypeDeviceType[], reload:void }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TypeDeviceListTable tableData={typeDeviceData} reload={reload}/>
      </Grid>
    </Grid>
  )
}

export default typeDeviceList
