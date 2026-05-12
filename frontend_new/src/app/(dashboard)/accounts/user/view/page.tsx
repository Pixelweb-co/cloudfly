'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import dynamic from 'next/dynamic'

// Component Imports
import UserLeftOverview from '@/views/apps/user/view/user-left-overview'
import UserRight from '@/views/apps/user/view/user-right'

// Dynamic Tab Imports
const OverViewTab = dynamic(() => import('@/views/apps/user/view/user-right/overview'))
const SecurityTab = dynamic(() => import('@/views/apps/user/view/user-right/security'))
const BillingPlansTab = dynamic(() => import('@/views/apps/user/view/user-right/billing-plans'))
const SignatureTab = dynamic(() => import('@/views/apps/user/view/user-right/signature'))

const UserViewPage = () => {
  const tabContentList = {
    overview: <OverViewTab />,
    security: <SecurityTab />,
    'billing-plans': <BillingPlansTab />,
    signature: <SignatureTab />
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} lg={4} md={5}>
        <UserLeftOverview />
      </Grid>
      <Grid item xs={12} lg={8} md={7}>
        <UserRight tabContentList={tabContentList} />
      </Grid>
    </Grid>
  )
}

export default UserViewPage
