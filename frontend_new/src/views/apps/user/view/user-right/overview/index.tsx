'use client'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import ProjectListTable from './ProjectListTable'
import UserActivityTimeLine from './UserActivityTimeline'
import InvoiceListTable from './InvoiceListTable'
import ListaTrabajo from '@/views/apps/ecommerce/dashboard/ListaTrabajo'

// Utils
import { userMethods } from '@/utils/userMethods'


/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.NEXT_PUBLIC_API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/apps/invoice` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */

/* const getInvoiceData = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apps/invoice`)

  if (!res.ok) {
    throw new Error('Failed to fetch invoice data')
  }

  return res.json()
} */

import ConsumptionDashboard from '@/views/administracion/consumo/ConsumptionDashboard'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'

const OverViewTab = () => {
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
                <Chip label='Al día' color='success' size='small' variant='tonal' />
              </div>
              <Divider />
              <div className='flex justify-between items-center'>
                <Typography color='text.primary' className='font-medium'>Último Pago:</Typography>
                <Typography>$49.00 USD - 15 Mayo, 2026</Typography>
              </div>
              <div className='flex justify-between items-center'>
                <Typography color='text.primary' className='font-medium'>Próximo Cobro:</Typography>
                <Typography>$49.00 USD - 15 Junio, 2026</Typography>
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
