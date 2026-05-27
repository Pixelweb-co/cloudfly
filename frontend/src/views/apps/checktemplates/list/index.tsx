'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ChecktemplatesListTable from './ChecktemplatesListTable'
import type { CheckTemplateType } from '@/types/apps/checkTemplateType'

const ChecktemplateList = ({ reload, checkTemplateData }: { reload: any; checkTemplateData: any }) => {
  console.log('checkTemplateData', checkTemplateData)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ChecktemplatesListTable tableData={checkTemplateData} reload={reload} />
      </Grid>
    </Grid>
  )
}

export default ChecktemplateList
