'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import type { ButtonProps } from '@mui/material/Button'

// Component Imports
import UpgradePlan from '@components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

// Utils
import { userMethods } from '@/utils/userMethods'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'

const UserPlan = () => {
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

  // Vars
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Mejorar Plan'
  }

  if (loading) {
    return (
      <Card className='border-2 border-primary rounded shadow-primarySm'>
        <CardContent className='flex justify-center items-center h-32'>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card className='border-2 border-primary rounded shadow-primarySm'>
        <CardContent className='flex flex-col gap-6'>
          <Typography variant='h6' color='text.primary'>No hay suscripción activa</Typography>
          <Typography variant='body2'>Actualmente no tienes un plan de suscripción asociado.</Typography>
          <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={UpgradePlan} />
        </CardContent>
      </Card>
    )
  }

  const isTrial = subscription.status === 'TRIAL'
  const planName = subscription.planName || 'Plan'
  const price = subscription.monthlyPrice || 0
  const billingCycle = subscription.billingCycle === 'ANNUAL' ? '/año' : '/mes'
  const badgeLabel = isTrial ? 'PERÍODO DE PRUEBA' : 'ACTIVO'
  const badgeColor = isTrial ? 'warning' : 'success'

  // Calculate days progress
  const start = new Date(subscription.startDate).getTime()
  const end = new Date(subscription.endDate).getTime()
  const now = new Date().getTime()
  
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  const daysPassed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)))
  const daysRemaining = Math.max(0, totalDays - daysPassed)
  const progressPercent = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100))

  return (
    <>
      <Card className='border-2 border-primary rounded shadow-primarySm'>
        <CardContent className='flex flex-col gap-6'>
          <div className='flex justify-between'>
            <Chip label={badgeLabel} size='small' color={badgeColor} variant='tonal' />
            <div className='flex justify-center'>
              <Typography variant='h5' component='sup' className='self-start' color='primary'>
                $
              </Typography>
              <Typography component='span' variant='h1' color='primary'>
                {price}
              </Typography>
              <Typography component='sub' className='self-end' color='text.primary'>
                {billingCycle}
              </Typography>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <Typography variant='h6' className='font-bold'>{planName}</Typography>
            <div className='flex items-center gap-2'>
              <i className='tabler-circle-filled text-[10px] text-secondary' />
              <Typography component='span'>{subscription.effectiveAiTokensLimit} Tokens IA / mes</Typography>
            </div>
            <div className='flex items-center gap-2'>
              <i className='tabler-circle-filled text-[10px] text-secondary' />
              <Typography component='span'>Hasta {subscription.effectiveUsersLimit} Usuarios</Typography>
            </div>
            <div className='flex items-center gap-2'>
              <i className='tabler-circle-filled text-[10px] text-secondary' />
              <Typography component='span'>Módulos: {subscription.moduleNames?.join(', ')}</Typography>
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <Typography className='font-medium' color='text.primary'>
                Uso Mensual
              </Typography>
              <Typography className='font-medium' color='text.primary'>
                {daysPassed} de {totalDays} Días
              </Typography>
            </div>
            <LinearProgress variant='determinate' value={progressPercent} />
            <Typography variant='body2'>{daysRemaining} días restantes del ciclo</Typography>
          </div>
          <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={UpgradePlan} />
        </CardContent>
      </Card>
    </>
  )
}

export default UserPlan
