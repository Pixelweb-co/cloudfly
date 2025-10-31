// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { TemplateVerificationType } from '../type/TemplateVerificationType'

// Component Imports
import TemplateVerificationListTable from './TemplateVerificationListTable'

const TemplateVerificationList = ({ typeDeviceData, reload }: { typeDeviceData?: TemplateVerificationType[], reload:void }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TemplateVerificationListTable tableData={typeDeviceData} reload={reload}/>
      </Grid>
    </Grid>
  )
}

export default TemplateVerificationList
