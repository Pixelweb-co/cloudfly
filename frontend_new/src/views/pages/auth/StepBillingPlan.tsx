'use client'

import { useState, useEffect } from 'react'
import { Grid, Typography, Card, CardContent, Radio, Button, Box, TextField, Alert, CircularProgress, Divider, Avatar, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
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

  const formatCardNumber = (value: string) => {
    return value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19)
  }

  const handleConfirm = async () => {
    if (!selectedPlan) return toast.error('Seleccione un plan')
    const cleanNumber = cardData.number.replace(/\s/g, '')
    
    // Wompi Test Logic
    if (cleanNumber === '4111111111111111') return toast.error('Transacción declinada por el emisor.')
    if (cleanNumber !== '4242424242424242') return toast.error('Tarjeta no válida para pruebas.')

    setLoading(true)
    try {
      const paymentMethod = {
        tenantId,
        provider: 'WOMPI',
        paymentSourceId: 'src_test_' + Math.random().toString(36).substr(2, 9),
        token: 'tok_test_' + Math.random().toString(36).substr(2, 15),
        brand: 'VISA',
        last4: cleanNumber.slice(-4),
        expMonth: 12,
        expYear: 28,
        isDefault: true
      }

      await axiosInstance.post('/internal/billing/payment-methods', paymentMethod)
      const subRes = await axiosInstance.post(`/api/v1/subscriptions/users/${userId}/subscribe`, {
        planId: selectedPlan.id,
        isAutoRenew: true
      })
      
      await axiosInstance.post(`/internal/billing/subscriptions/${subRes.data.id}/activate-trial`)
      const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 14)
      
      await axiosInstance.post('http://scheduler-service:8080/api/scheduler/billing/init', {
        tenantId,
        subscriptionId: subRes.data.id,
        trialEndsAt: trialEnd.toISOString()
      })

      toast.success('Suscripción activada con éxito.')
      handleNext()
    } catch (err) {
      toast.error('Error en el procesamiento del alta.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingPlans) return <Box className='flex justify-center p-20'><CircularProgress /></Box>

  return (
    <Box className='max-w-7xl mx-auto px-4'>
      <Grid container spacing={10}>
        
        {/* COLUMNA IZQUIERDA: FORMULARIO Y SELECCIÓN (60%) */}
        <Grid item xs={12} md={7}>
          <Box className='mb-10'>
            <Typography variant='h4' className='font-black mb-2 text-slate-900'>Configuración de Suscripción</Typography>
            <Typography variant='body1' color='textSecondary'>Complete los detalles de facturación para activar su cuenta.</Typography>
          </Box>

          <Typography variant='subtitle1' className='font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs text-slate-500'>
            01 — Selección del Plan
          </Typography>
          
          <Box className='grid grid-cols-1 gap-4 mb-12'>
            {plans.map((plan) => (
              <Box
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  selectedPlan?.id === plan.id 
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' 
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <Box className='flex items-center gap-4'>
                  <Radio checked={selectedPlan?.id === plan.id} size='small' color='default' />
                  <Box>
                    <Typography className='font-bold text-slate-900'>{plan.name}</Typography>
                    <Typography variant='caption' color='textSecondary'>{plan.description}</Typography>
                  </Box>
                </Box>
                <Typography className='font-bold text-slate-900'>${plan.price.toLocaleString()}<span className='text-xs font-normal text-slate-500'>/mes</span></Typography>
              </Box>
            ))}
          </Box>

          <Typography variant='subtitle1' className='font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs text-slate-500'>
            02 — Información de Pago
          </Typography>

          <Box className='bg-white p-8 rounded-2xl border border-slate-200 shadow-sm'>
            <Grid container spacing={5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Número de Tarjeta'
                  variant='standard'
                  placeholder='4242 4242 4242 4242'
                  value={cardData.number}
                  onChange={(e) => setCardData({...cardData, number: formatCardNumber(e.target.value)})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Nombre del Titular'
                  variant='standard'
                  placeholder='NOMBRE COMO APARECE EN LA TARJETA'
                  value={cardData.name}
                  onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label='Vencimiento'
                  variant='standard'
                  placeholder='MM / YY'
                  value={cardData.expiry}
                  onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label='CVC / CVV'
                  variant='standard'
                  placeholder='123'
                  type='password'
                  value={cardData.cvc}
                  onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <Box className='mt-10 flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all'>
              <img src='https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg' height='15' alt='Visa' />
              <img src='https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' height='25' alt='Mastercard' />
              <img src='https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' height='20' alt='Paypal' />
            </Box>
          </Box>
        </Grid>

        {/* COLUMNA DERECHA: RESUMEN (40%) */}
        <Grid item xs={12} md={5}>
          <Box className='sticky top-10 bg-slate-50 p-10 rounded-3xl border border-slate-200'>
            <Typography variant='h6' className='font-bold mb-6 text-slate-900'>Resumen del Pedido</Typography>
            
            <Box className='flex justify-between mb-4'>
              <Typography color='textSecondary'>Plan seleccionado:</Typography>
              <Typography className='font-bold'>{selectedPlan?.name || 'Ninguno'}</Typography>
            </Box>
            <Box className='flex justify-between mb-4'>
              <Typography color='textSecondary'>Período de prueba:</Typography>
              <Typography className='font-bold text-success'>14 Días Gratis</Typography>
            </Box>
            
            <Divider className='my-6' />
            
            <Box className='flex justify-between items-end mb-8'>
              <Box>
                <Typography variant='h4' className='font-black text-slate-900'>$0.00</Typography>
                <Typography variant='caption' className='text-slate-500'>Debido hoy</Typography>
              </Box>
              <Typography variant='body2' className='text-right text-slate-500'>
                Luego ${selectedPlan?.price.toLocaleString()}/mes <br/>
                <span className='text-[10px] uppercase'>Inicia el {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </Typography>
            </Box>

            <List className='mb-8'>
              {['Acceso ilimitado a todas las funciones', 'Soporte prioritario 24/7', 'Cancelación flexible en cualquier momento'].map((text) => (
                <ListItem key={text} className='px-0 py-1'>
                  <ListItemIcon className='min-w-[30px]'><i className='tabler-check text-success text-sm'/></ListItemIcon>
                  <ListItemText primary={text} primaryTypographyProps={{ variant: 'caption', className: 'text-slate-600' }} />
                </ListItem>
              ))}
            </List>

            <Button
              fullWidth
              variant='contained'
              size='large'
              onClick={handleConfirm}
              disabled={loading}
              className='py-5 rounded-xl bg-slate-900 hover:bg-slate-800 shadow-none normal-case text-lg font-bold'
            >
              {loading ? <CircularProgress size={24} color='inherit' /> : 'Confirmar Suscripción'}
            </Button>

            <Box className='mt-8 text-center'>
              <Box className='flex justify-center gap-2 mb-2'>
                <i className='tabler-lock text-xs text-slate-400' />
                <Typography variant='caption' className='text-slate-400 font-medium uppercase tracking-tighter'>Conexión Segura SSL</Typography>
              </Box>
              <Typography variant='caption' className='text-slate-400 block leading-tight'>
                Sus datos están encriptados y procesados de acuerdo a la normativa PCI-DSS Nivel 1.
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
      
      <Box className='mt-20 border-t border-slate-100 pt-8 flex justify-between items-center opacity-50'>
        <Button onClick={handleBack} variant='text' color='inherit' className='normal-case' startIcon={<i className='tabler-arrow-left'/>}>
          Atrás
        </Button>
        <Typography variant='caption'>CloudFly © 2026 • Sistema de Facturación Inteligente</Typography>
      </Box>
    </Box>
  )
}

export default StepBillingPlan
