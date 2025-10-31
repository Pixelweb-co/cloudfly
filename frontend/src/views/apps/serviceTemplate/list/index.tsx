// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { ServiceTemplateType } from '../type/ServiceTemplate'

// Component Imports
import ServiceTemplateListTable from './serviceTemplate'

const ServiceTemplateList = ({ ServiceTemplateData, reload }: { ServiceTemplateData?: ServiceTemplateType[], reload:void }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ServiceTemplateListTable tableData={ServiceTemplateData} reload={reload}/>
      </Grid>
    </Grid>
  )
}

export default ServiceTemplateList
