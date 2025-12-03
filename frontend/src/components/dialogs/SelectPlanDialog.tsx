'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material'
import { useSubscription } from '@/hooks/useSubscription'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
  isActive: boolean
}

interface SelectPlanDialogProps {
  open: boolean
  onClose: () => void
  onSelectPlan: (plan: Plan) => void
  loading?: boolean
}

const SelectPlanDialog = ({ open, onClose, onSelectPlan, loading = false }: SelectPlanDialogProps) => {
  const { plans, loading: plansLoading, error, fetchActivePlans } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  useEffect(() => {
    if (open && plans.length === 0) {
      fetchActivePlans().catch(() => {
        // Error ya manejado en el hook
      })
    }
  }, [open, plans.length, fetchActivePlans])

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan)
  }

  const handleConfirm = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan)
    }
  }

  const isLoading = plansLoading || loading

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          Selecciona tu Plan
        </Typography>
        <Typography variant='body2' color='textSecondary' sx={{ mt: 0.5 }}>
          Elige el plan que mejor se adapte a tus necesidades
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading && !plans.length ? (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight={300}>
            <CircularProgress />
          </Box>
        ) : plans.length === 0 ? (
          <Alert severity='warning'>No hay planes disponibles en este momento</Alert>
        ) : (
          <Grid container spacing={2}>
            {plans.map((plan) => (
              <Grid item xs={12} sm={6} key={plan.id}>
                <Card
                  onClick={() => handleSelectPlan(plan)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedPlan?.id === plan.id ? '2px solid' : '1px solid',
                    borderColor: selectedPlan?.id === plan.id ? 'primary.main' : 'divider',
                    bgcolor: selectedPlan?.id === plan.id ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent>
                    <Box display='flex' justifyContent='space-between' alignItems='start' mb={1}>
                      <Typography variant='h6' sx={{ fontWeight: 600 }}>
                        {plan.name}
                      </Typography>
                      {selectedPlan?.id === plan.id && (
                        <Chip label='Seleccionado' color='primary' size='small' />
                      )}
                    </Box>

                    <Typography variant='body2' color='textSecondary' sx={{ mb: 2, minHeight: 40 }}>
                      {plan.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant='h5' sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ${plan.price.toFixed(2)}
                        <Typography component='span' variant='body2' color='textSecondary'>
                          {' '}
                          / {plan.durationDays} días
                        </Typography>
                      </Typography>
                    </Box>

                    <Box display='flex' gap={1} flexWrap='wrap'>
                      <Chip
                        label={`${plan.durationDays} días de acceso`}
                        variant='outlined'
                        size='small'
                      />
                      <Chip label='Renovación manual' variant='outlined' size='small' />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ pt: 2, pb: 2, px: 3 }}>
        <Button onClick={onClose} variant='outlined'>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          variant='contained'
          disabled={!selectedPlan || isLoading}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SelectPlanDialog
