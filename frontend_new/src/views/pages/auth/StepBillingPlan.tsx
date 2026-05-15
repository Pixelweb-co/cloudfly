'use client'

import { useState, useEffect } from 'react'
import { Grid, Typography, Card, CardContent, Radio, Button, Box, TextField, Alert, CircularProgress, Divider } from '@mui/material'
import { useSubscription } from '@/hooks/useSubscription'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-toastify'

interface StepBillingPlanProps {
  handleNext: () => void
  handleBack: () => void
  tenantId: number
  userId: number
}

const StepBillingPlan = ({ handleNext, handleBack, tenantId, userId }: StepBillingPlanProps) => {
  const { plans, fetchActivePlans, loading: loadingPlans } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: ''
  })

  useEffect(() => {
    fetchActivePlans().then(data => {
      if (data && data.length > 0) {
        setSelectedPlan(data[0])
      }
    })
  }, [fetchActivePlans])

  const handleConfirm = async () => {
    if (!selectedPlan) {
      toast.error('Por favor selecciona un plan')
      return
    }

    if (cardData.number.length < 16 || cardData.cvc.length < 3) {
      toast.error('Por favor ingresa datos de tarjeta válidos')
      return
    }

    setLoading(true)
    try {
      // 1. Guardar Método de Pago (Tokenización simulada)
      const paymentMethod = {
        tenantId,
        provider: 'WOMPI',
        paymentSourceId: 'src_' + Math.random().toString(36).substr(2, 9),
        token: 'tok_test_' + Math.random().toString(36).substr(2, 15),
        brand: 'VISA',
        last4: cardData.number.slice(-4),
        expMonth: parseInt(cardData.expiry.split('/')[0]),
        expYear: parseInt(cardData.expiry.split('/')[1]),
        isDefault: true
      }

      await axiosInstance.post('/internal/billing/payment-methods', paymentMethod)

      // 2. Crear Suscripción y Activar Trial
      const subResponse = await axiosInstance.post(`/api/v1/subscriptions/users/${userId}/subscribe`, {
        planId: selectedPlan.id,
        isAutoRenew: true
      })

      const subscriptionId = subResponse.data.id

      // Activar trial de 14 días en backend
      await axiosInstance.post(`/internal/billing/subscriptions/${subscriptionId}/activate-trial`)

      // 3. Inicializar Calendario de Facturación en Scheduler
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)

      await axiosInstance.post('http://scheduler-service:8080/api/scheduler/billing/init', {
        tenantId,
        subscriptionId,
        trialEndsAt: trialEndsAt.toISOString()
      })

      toast.success('¡Método de pago validado y Trial de 14 días activado!')
      handleNext()
    } catch (err: any) {
      console.error('Error in billing setup:', err)
      toast.error('Hubo un error al configurar el plan. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingPlans) return <Box className='flex justify-center p-12'><CircularProgress /></Box>

  return (
    <Box className='p-4'>
      <Typography variant='h5' className='mb-2 font-semibold text-center'>
        Selecciona tu Plan y Activa tu Trial 🚀
      </Typography>
      <Typography variant='body2' className='mb-8 text-textSecondary text-center'>
        Ingresa tu método de pago para activar los 14 días de prueba gratuita. No se realizará ningún cobro hoy.
      </Typography>

      <Grid container spacing={6}>
        {/* Columna Izquierda: Planes */}
        <Grid item xs={12} md={7}>
          <Typography variant='h6' className='mb-4 font-medium'>Planes Disponibles</Typography>
          <Grid container spacing={4}>
            {plans.map((plan) => (
              <Grid item xs={12} key={plan.id}>
                <Card 
                  className={`cursor-pointer transition-all border-2 ${selectedPlan?.id === plan.id ? 'border-primary bg-primary/5 shadow-md' : 'border-divider'}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className='flex items-center justify-between p-4'>
                    <Box className='flex items-center gap-4'>
                      <Radio checked={selectedPlan?.id === plan.id} />
                      <Box>
                        <Typography variant='h6' className='font-bold'>{plan.name}</Typography>
                        <Typography variant='caption' color='textSecondary'>{plan.description}</Typography>
                      </Box>
                    </Box>
                    <Box className='text-right'>
                      <Typography variant='h5' color='primary' className='font-bold'>${plan.price.toLocaleString()}</Typography>
                      <Typography variant='caption'>/mes</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity='info' className='mt-6'>
            <strong>Trial de 14 días:</strong> Puedes cancelar en cualquier momento antes del vencimiento y no se te cobrará nada.
          </Alert>
        </Grid>

        {/* Columna Derecha: Tarjeta */}
        <Grid item xs={12} md={5}>
          <Card className='border border-divider shadow-sm'>
            <CardContent>
              <Typography variant='h6' className='mb-4 font-medium'>Método de Pago</Typography>
              <Box className='flex flex-col gap-4'>
                <TextField 
                  label='Número de Tarjeta' 
                  fullWidth 
                  size='small' 
                  placeholder='0000 0000 0000 0000'
                  value={cardData.number}
                  onChange={(e) => setCardData({...cardData, number: e.target.value})}
                />
                <TextField 
                  label='Nombre en la Tarjeta' 
                  fullWidth 
                  size='small' 
                  placeholder='JUAN PEREZ'
                  value={cardData.name}
                  onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                />
                <Box className='flex gap-4'>
                  <TextField 
                    label='Vencimiento' 
                    placeholder='MM/YY' 
                    size='small'
                    value={cardData.expiry}
                    onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                  />
                  <TextField 
                    label='CVC' 
                    placeholder='123' 
                    size='small'
                    value={cardData.cvc}
                    onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                  />
                </Box>
                <Divider className='my-2' />
                <Box className='flex justify-between items-center'>
                  <Typography variant='body2' className='font-medium'>Total Hoy:</Typography>
                  <Typography variant='h6' color='success.main' className='font-bold'>$0.00</Typography>
                </Box>
                <Typography variant='caption' color='textSecondary'>
                  Primer cobro el: {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Botones de Navegación */}
      <Box className='flex justify-between mt-12'>
        <Button onClick={handleBack} variant='outlined'>Atrás</Button>
        <Button 
          variant='contained' 
          onClick={handleConfirm} 
          disabled={loading}
          size='large'
          className='min-w-[200px]'
        >
          {loading ? <CircularProgress size={24} color='inherit' /> : 'Activar mi Cuenta 🚀'}
        </Button>
      </Box>
    </Box>
  )
}

export default StepBillingPlan
