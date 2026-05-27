'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

// Component Imports
import UserActivityTimeLine from './UserActivityTimeline'
import ConsumptionDashboard from '@/views/administracion/consumo/ConsumptionDashboard'

// Utils
import { userMethods } from '@/utils/userMethods'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'

const OverViewTab = () => {
  const [subscription, setSubscription] = useState<any>(null)

  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser
  const tenantId = sessionUser?.customerId

  useEffect(() => {
    if (tenantId) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      axios.get(`${API_URL}/api/v1/subscriptions/tenant/${tenantId}/active`, { headers })
        .then(res => setSubscription(res.data))
        .catch(err => console.log("Error fetching active subscription for overview", err))
    }
  }, [tenantId])

  const statusChip = () => {
    if (!subscription) return <Chip label='Sin Plan' color='default' size='small' variant='tonal' />
    if (subscription.status === 'TRIAL') return <Chip label='Período de Prueba' color='warning' size='small' variant='tonal' />
    if (subscription.status === 'ACTIVE') return <Chip label='Al día' color='success' size='small' variant='tonal' />
    if (subscription.status === 'SUSPENDED') return <Chip label='Suspendida' color='error' size='small' variant='tonal' />
    return <Chip label={subscription.status} color='primary' size='small' variant='tonal' />
  }

  const price = subscription?.monthlyPrice || 0
  const endDate = subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : '-'

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ConsumptionDashboard />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Resumen de Pagos' />
          <CardContent>
            <div className='flex flex-col gap-4'>
              <div className='flex justify-between items-center'>
                <Typography color='text.primary' className='font-medium'>Estado de Cuenta:</Typography>
                {statusChip()}
              </div>
              <Divider />
              <div className='flex justify-between items-center'>
                <Typography color='text.primary' className='font-medium'>Último Pago:</Typography>
                <Typography>{subscription?.status === 'TRIAL' ? 'N/A - En Prueba' : 'Consultando Historial...'}</Typography>
              </div>
              <div className='flex justify-between items-center'>
                <Typography color='text.primary' className='font-medium'>Próximo Cobro:</Typography>
                <Typography>{price > 0 ? `$${price.toLocaleString()} USD - ${endDate}` : 'N/A'}</Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <UserActivityTimeLine />
      </Grid>
    </Grid>
  )
}

export default OverViewTab
