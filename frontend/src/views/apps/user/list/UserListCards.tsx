// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { UserDataType } from '@components/card-statistics/HorizontalWithSubtitle'

// Component Imports
// eslint-disable-next-line import/no-unresolved
import HorizontalWithSubtitle from '@components/card-statistics/HorizontalWithSubtitle'

// Vars
const data: UserDataType[] = [
  {
    title: 'Total usuarios',
    stats: '21,459',
    avatarIcon: 'tabler-users',
    avatarColor: 'primary',
    trend: 'positive',
    trendNumber: '29%',
    subtitle: 'Total User'
  },
  {
    title: 'Activos',
    stats: '0',
    avatarIcon: 'tabler-user-check',
    avatarColor: 'success',
    trend: 'positive',
    trendNumber: '18%',
    subtitle: 'Last week analytics'
  },
  {
    title: 'Inactivos',
    stats: '0',
    avatarIcon: ' tabler-user-plus',
    avatarColor: 'error',
    trend: 'negative',
    trendNumber: '14%',
    subtitle: 'Last week analytics'
  },
  {
    title: 'Pendientes',
    stats: '0',
    avatarIcon: 'tabler-user-search',
    avatarColor: 'warning',
    trend: 'positive',
    trendNumber: '42%',
    subtitle: 'Last week analytics'
  }
]

const UserListCards = ({ users }:{users:any}) => {
  return (
    <Grid container spacing={6}>
      {data.map((item, i) => {
        if (item.title == 'Total usuarios') {
          item.stats = users.length ? users.length.toString() : '0'
        }

        if (item.title == 'Activos') {
          item.stats = users.length ? users.filter((user:any) => user.enabled === true).length.toString() : '0'
        }

        if (item.title == 'Inactivos') {
          item.stats = users.length ? users.filter((user:any) => user.enabled === false).length.toString() : '0'
        }

        return (
          <Grid key={i} item xs={12} sm={6} md={3}>
            <HorizontalWithSubtitle {...item} />
          </Grid>
        )
      })}
    </Grid>
  )
}

export default UserListCards
