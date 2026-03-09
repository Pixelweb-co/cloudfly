'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { useSubscription } from '@/hooks/useSubscription'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
  isActive: boolean
}

interface CheckoutDialogProps {
  open: boolean
  onClose: () => void
  plan: Plan | null
  userId: number
  customerName?: string
}

interface CheckoutFormData {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
  email: string
}

const CheckoutDialog = ({
  open,
  onClose,
  plan,
  userId,
  customerName = ''
}: CheckoutDialogProps) => {
  const { subscribeToPlan, loading: subscriptionLoading, error } = useSubscription()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CheckoutFormData>({
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      email: ''
    }
  })

  if (!plan) return null

  const handleCheckout = async (data: CheckoutFormData) => {
    try {
      setIsProcessing(true)

      // Simulación de procesamiento de pago (en producción integrarías Stripe/PayPal)
      // Aquí solo validamos que los datos sean válidos
      if (!data.cardNumber || !data.cardHolder || !data.expiryDate || !data.cvv) {
        toast.error('Por favor completa todos los datos de la tarjeta')
        return
      }

      // Simular delay de procesamiento de pago
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Crear suscripción en el backend
      await subscribeToPlan(userId, plan.id, false)

      toast.success(`¡Suscripción a ${plan.name} completada!`)
      reset()
      onClose()

      // Redirigir al home después de 1 segundo
      setTimeout(() => {
        router.push('/home')
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          Resumen de Compra
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Resumen del Plan */}
        <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display='flex' justifyContent='space-between' mb={1}>
                  <Typography variant='body2' color='textSecondary'>
                    Plan:
                  </Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {plan.name}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display='flex' justifyContent='space-between' mb={1}>
                  <Typography variant='body2' color='textSecondary'>
                    Duración:
                  </Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {plan.durationDays} días
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12}>
                <Box display='flex' justifyContent='space-between'>
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    Total:
                  </Typography>
                  <Typography variant='h6' sx={{ fontWeight: 700, color: 'primary.main' }}>
                    ${plan.price.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 2 }}>
          Información de Pago
        </Typography>

        <form onSubmit={handleSubmit(handleCheckout)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Email */}
            <Controller
              name='email'
              control={control}
              rules={{
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Email'
                  placeholder='tu@email.com'
                  type='email'
                  fullWidth
                  size='small'
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />

            {/* Card Number */}
            <Controller
              name='cardNumber'
              control={control}
              rules={{
                required: 'Número de tarjeta requerido',
                pattern: {
                  value: /^\d{13,19}$/,
                  message: 'Número de tarjeta inválido'
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Número de Tarjeta'
                  placeholder='1234 5678 9012 3456'
                  fullWidth
                  size='small'
                  error={!!errors.cardNumber}
                  helperText={errors.cardNumber?.message}
                />
              )}
            />

            {/* Card Holder */}
            <Controller
              name='cardHolder'
              control={control}
              rules={{ required: 'Nombre del titular requerido' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label='Titular de la Tarjeta'
                  placeholder='Juan Pérez'
                  fullWidth
                  size='small'
                  error={!!errors.cardHolder}
                  helperText={errors.cardHolder?.message}
                />
              )}
            />

            {/* Expiry Date and CVV */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Controller
                name='expiryDate'
                control={control}
                rules={{
                  required: 'Fecha requerida',
                  pattern: {
                    value: /^\d{2}\/\d{2}$/,
                    message: 'Formato: MM/YY'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Fecha Vencimiento'
                    placeholder='MM/YY'
                    size='small'
                    error={!!errors.expiryDate}
                    helperText={errors.expiryDate?.message}
                  />
                )}
              />

              <Controller
                name='cvv'
                control={control}
                rules={{
                  required: 'CVV requerido',
                  pattern: {
                    value: /^\d{3,4}$/,
                    message: 'CVV inválido'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='CVV'
                    placeholder='123'
                    size='small'
                    error={!!errors.cvv}
                    helperText={errors.cvv?.message}
                  />
                )}
              />
            </Box>

            <Alert severity='info'>
              Esto es una demostración. Los datos de pago no se almacenan ni se procesan realmente.
            </Alert>
          </Box>
        </form>
      </DialogContent>

      <DialogActions sx={{ pt: 2, pb: 2, px: 3 }}>
        <Button onClick={onClose} variant='outlined' disabled={isProcessing}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit(handleCheckout)}
          variant='contained'
          disabled={isProcessing || subscriptionLoading}
          sx={{ minWidth: 140 }}
        >
          {isProcessing || subscriptionLoading ? (
            <CircularProgress size={24} color='inherit' />
          ) : (
            `Pagar $${plan.price.toFixed(2)}`
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CheckoutDialog
