'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Grid from '@mui/material/Grid'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'

// Utils
import { userMethods } from '@/utils/userMethods'

const UserRight = ({ tabContentList }: { tabContentList: { [key: string]: ReactElement } }) => {
  // States
  const [activeTab, setActiveTab] = useState('overview')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser
  const role = sessionUser?.roles?.[0]?.name || sessionUser?.roles?.[0]?.role || 'USER'

  return (
    <>
      <TabContext value={activeTab}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <CustomTabList onChange={handleChange} variant='scrollable' pill='true'>
              <Tab icon={<i className='tabler-users' />} value='overview' label='General' iconPosition='start' />
              <Tab icon={<i className='tabler-lock' />} value='security' label='Seguridad' iconPosition='start' />
              {role !== 'MANAGER' && (
                <Tab icon={<i className='tabler-credit-card' />} value='billing-plans' label='Suscripción y Pagos' iconPosition='start' />
              )}
              <Tab
                icon={<i className='tabler-bookmark' />}
                value='signature'
                label='Firma'
                iconPosition='start'
              />
             </CustomTabList>
          </Grid>
          <Grid item xs={12}>
            <TabPanel value={activeTab} className='p-0'>
              {tabContentList[activeTab]}
            </TabPanel>
          </Grid>
        </Grid>
      </TabContext>
    </>
  )
}

export default UserRight
