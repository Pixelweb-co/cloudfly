'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { PricingPlanType } from '@/types/pages/pricingTypes'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import UpgradePlan from '@components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

// Utils
import { userMethods } from '@/utils/userMethods'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'

const CurrentPlan = ({ data }: { data?: PricingPlanType[] }) => {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser
  const tenantId = sessionUser?.customerId

  useEffect(() => {
    if (tenantId) {
      axios.get(`${API_URL}/api/v1/subscriptions/tenant/${tenantId}/active`)
        .then(res => {
          setSubscription(res.data)
          setLoading(false)
        })
        .catch(err => {
          console.error("Error fetching active subscription", err)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [tenantId])

  const buttonProps = (children: string, variant: ButtonProps['variant'], color: ThemeColor): ButtonProps => ({
    children,
    variant,
    color
  })

  if (loading) {
    return (
      <Card>
        <CardHeader title='Plan de Suscripción Actual' />
        <CardContent className='flex justify-center items-center h-32'>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader title='Plan de Suscripción Actual' />
        <CardContent>
          <Alert severity="info" icon={false}>
            <AlertTitle>No tienes un plan activo</AlertTitle>
            Actualmente no hay ninguna suscripción activa asociada a tu cuenta. Adquiere un plan para aprovechar CloudFly.
          </Alert>
          <div className='mt-4'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Elegir Plan', 'contained', 'primary')}
              dialog={UpgradePlan}
              dialogProps={{ data: data }}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const isTrial = subscription.status === 'TRIAL'
  const planName = subscription.planName || 'Plan'
  const price = subscription.monthlyPrice || 0
  const billingCycle = subscription.billingCycle === 'ANNUAL' ? '/ Año' : '/ Mes'
  
  // Calculate days progress
  const start = new Date(subscription.startDate).getTime()
  const end = new Date(subscription.endDate).getTime()
  const now = new Date().getTime()
  
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  const daysPassed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(0, totalDays - daysPassed)
  const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))

  return (
    <Card>
      <CardHeader title='Plan de Suscripción Actual' />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} md={6} className='flex flex-col gap-4'>
            <div>
              <Typography className='font-medium text-textPrimary'>Tu plan actual es {planName}</Typography>
              <Typography>SaaS especializado para gestión de negocios</Typography>
            </div>
            <div>
              <Typography className='font-medium' color='text.primary'>
                Próximo pago: {new Date(subscription.endDate).toLocaleDateString()}
              </Typography>
              <Typography>Se enviará una notificación automática 3 días antes del vencimiento</Typography>
            </div>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <Typography className='font-medium' color='text.primary'>
                  ${price.toLocaleString()} USD {billingCycle}
                </Typography>
                {isTrial ? (
                  <Chip color='warning' label='PERÍODO DE PRUEBA' size='small' variant='tonal' />
                ) : (
                  <Chip color='success' label='Activo' size='small' variant='tonal' />
                )}
              </div>
              <Typography>Módulos: {subscription.moduleNames?.join(', ')}</Typography>
            </div>
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert icon={false} severity={isTrial ? 'warning' : 'success'} className='mbe-4'>
              <AlertTitle>{isTrial ? '¡Prueba activa!' : '¡Tu cuenta está al día!'}</AlertTitle>
              {isTrial ? 'Aprovecha todos los beneficios antes de que termine tu trial.' : 'Gracias por ser parte del ecosistema CloudFly.'}
            </Alert>
            <div className='flex items-center justify-between'>
              <Typography className='font-medium' color='text.primary'>
                Uso del Ciclo
              </Typography>
              <Typography className='font-medium' color='text.primary'>
                {daysPassed} de {totalDays} Días
              </Typography>
            </div>
            <LinearProgress variant='determinate' value={progressPercent} className='mlb-1 bs-2.5' />
            <Typography variant='body2'>{daysRemaining} días restantes del periodo actual</Typography>
          </Grid>
          <Grid item xs={12} className='flex gap-4 flex-wrap'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Mejorar Plan', 'contained', 'primary')}
              dialog={UpgradePlan}
              dialogProps={{ data: data }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Cancelar Suscripción', 'tonal', 'error')}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'unsubscribe' }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CurrentPlan
