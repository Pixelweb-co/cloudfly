'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import SolicitudListTable from './SolicitudListTable'

const SolicitudList = ({ reload, solicitudData }: any) => {
  console.log('solicitudData', solicitudData)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <SolicitudListTable tableData={solicitudData} reload={reload} />
      </Grid>
    </Grid>
  )
}

export default SolicitudList
