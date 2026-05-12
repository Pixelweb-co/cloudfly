'use client'

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
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { PricingPlanType } from '@/types/pages/pricingTypes'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import UpgradePlan from '@components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const CurrentPlan = ({ data }: { data?: PricingPlanType[] }) => {
  const buttonProps = (children: string, variant: ButtonProps['variant'], color: ThemeColor): ButtonProps => ({
    children,
    variant,
    color
  })

  return (
    <Card>
      <CardHeader title='Plan de Suscripción Actual' />
      <CardContent>
        <Grid container spacing={6}>
          <Grid item xs={12} md={6} className='flex flex-col gap-4'>
            <div>
              <Typography className='font-medium text-textPrimary'>Tu plan actual es CloudFly Premium</Typography>
              <Typography>SaaS especializado para gestión de negocios</Typography>
            </div>
            <div>
              <Typography className='font-medium' color='text.primary'>
                Próximo pago: 15 de Junio, 2026
              </Typography>
              <Typography>Se enviará una notificación automática 3 días antes del vencimiento</Typography>
            </div>
            <div className='flex flex-col gap-1'>
              <div className='flex items-center gap-2'>
                <Typography className='font-medium' color='text.primary'>
                  $49.00 USD / Mes
                </Typography>
                <Chip color='primary' label='Activo' size='small' variant='tonal' />
              </div>
              <Typography>Acceso total a CRM, Inventarios y Campañas IA</Typography>
            </div>
          </Grid>
          <Grid item xs={12} md={6}>
            <Alert icon={false} severity='success' className='mbe-4'>
              <AlertTitle>¡Tu cuenta está al día!</AlertTitle>
              Gracias por ser parte del ecosistema CloudFly.
            </Alert>
            <div className='flex items-center justify-between'>
              <Typography className='font-medium' color='text.primary'>
                Uso del Ciclo
              </Typography>
              <Typography className='font-medium' color='text.primary'>
                26 de 30 Días
              </Typography>
            </div>
            <LinearProgress variant='determinate' value={86} className='mlb-1 bs-2.5' />
            <Typography variant='body2'>4 días restantes del periodo actual</Typography>
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
