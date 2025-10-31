// MUI Imports
import Grid from '@mui/material/Grid'

// Components Imports
import CongratulationsJohn from '@views/apps/ecommerce/dashboard/Congratulations'
import StatisticsCard from '@views/apps/ecommerce/dashboard/StatisticsCard'
import LineChartProfit from '@views/apps/ecommerce/dashboard/LineChartProfit'
import RadialBarChart from '@views/apps/ecommerce/dashboard/RadialBarChart'
import DonutChartGeneratedLeads from '@views/apps/ecommerce/dashboard/DonutChartGeneratedLeads'
import RevenueReport from '@views/apps/ecommerce/dashboard/RevenueReport'
import EarningReports from '@views/apps/ecommerce/dashboard/EarningReports'
import PopularProducts from '@views/apps/ecommerce/dashboard/PopularProducts'
import Orders from '@views/apps/ecommerce/dashboard/Orders'
import Transactions from '@views/apps/ecommerce/dashboard/Transactions'
import InvoiceListTable from '@views/apps/ecommerce/dashboard/InvoiceListTable'
import SolicitudesDonut from '@/views/apps/ecommerce/dashboard/SolicitudesEstadosDonut'
import EstadisticasGenerales from '@/views/apps/ecommerce/dashboard/EstadisticasGeneralesCard'
import ListaTrabajo from '@/views/apps/ecommerce/dashboard/ListaTrabajo'
import RequestsByMonthBar from '@views/apps/ecommerce/dashboard/RequestsByMonthBar'

// Data Imports
//import { getInvoiceData } from '@/app/server/actions'

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.NEXT_PUBLIC_API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/apps/invoice` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */

/* const getInvoiceData = async () => {
  // Vars
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/apps/invoice`)

  if (!res.ok) {
    throw new Error('Failed to fetch invoice data')
  }

  return res.json()
}
 */

const EcommerceDashboard = async () => {
  // Vars
  const invoiceData:any[] = []

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={4}>
      <SolicitudesDonut />
      </Grid>
      <Grid item xs={12} md={8}>
        <EstadisticasGenerales />
      </Grid>
      <Grid item xs={12} xl={4}>
      <ListaTrabajo />
      </Grid>
      <Grid item xs={12} xl={8}>
        {/* <RevenueReport /> */}
        <RequestsByMonthBar />
      </Grid>

    </Grid>
  )
}

export default EcommerceDashboard
