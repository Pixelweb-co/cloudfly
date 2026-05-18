// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import UserDetails from './UserDetails'
import UserPlan from './UserPlan'

// Utils
import { userMethods } from '@/utils/userMethods'

const UserLeftOverview = () => {
  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser
  const role = sessionUser?.roles?.[0]?.name || sessionUser?.roles?.[0]?.role || 'USER'

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <UserDetails />
      </Grid>
      {role !== 'MANAGER' && (
        <Grid item xs={12}>
          <UserPlan />
        </Grid>
      )}
    </Grid>
  )
}

export default UserLeftOverview
