// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { RolesType } from '@/types/apps/roleType'

// Component Imports
import RoleListTable from './RoleListTable'

const RoleList = ({ roleData }: { roleData?: RolesType[] }) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <RoleListTable tableData={roleData} />
      </Grid>
    </Grid>
  )
}

export default RoleList
