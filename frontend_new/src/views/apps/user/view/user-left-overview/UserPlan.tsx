// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Button from '@mui/material/Button'
import type { ButtonProps } from '@mui/material/Button'

// Component Imports
import UpgradePlan from '@components/dialogs/upgrade-plan'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

const UserPlan = () => {
  // Vars
  const buttonProps: ButtonProps = {
    variant: 'contained',
    children: 'Mejorar Plan'
  }

  return (
    <>
      <Card className='border-2 border-primary rounded shadow-primarySm'>
        <CardContent className='flex flex-col gap-6'>
          <div className='flex justify-between'>
            <Chip label='Plan Premium' size='small' color='primary' variant='tonal' />
            <div className='flex justify-center'>
              <Typography variant='h5' component='sup' className='self-start' color='primary'>
                $
              </Typography>
              <Typography component='span' variant='h1' color='primary'>
                49
              </Typography>
              <Typography component='sub' className='self-end' color='text.primary'>
                /mes
              </Typography>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-2'>
              <i className='tabler-circle-filled text-[10px] text-secondary' />
              <Typography component='span'>Acceso Ilimitado CRM</Typography>
            </div>
            <div className='flex items-center gap-2'>
              <i className='tabler-circle-filled text-[10px] text-secondary' />
              <Typography component='span'>Hasta 20 GB de Almacenamiento</Typography>
            </div>
            <div className='flex items-center gap-2'>
              <i className='tabler-circle-filled text-[10px] text-secondary' />
              <Typography component='span'>Soporte Prioritario 24/7</Typography>
            </div>
          </div>
          <div className='flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <Typography className='font-medium' color='text.primary'>
                Uso Mensual
              </Typography>
              <Typography className='font-medium' color='text.primary'>
                26 de 30 Días
              </Typography>
            </div>
            <LinearProgress variant='determinate' value={86} />
            <Typography variant='body2'>4 días restantes del ciclo</Typography>
          </div>
          <OpenDialogOnElementClick element={Button} elementProps={buttonProps} dialog={UpgradePlan} />
        </CardContent>
      </Card>
    </>
  )
}

export default UserPlan
