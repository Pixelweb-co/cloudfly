'use client'

// React Imports
import { useEffect, useState } from 'react'

// Redux Imports
import { useAppSelector, useAppDispatch } from '@/redux/hooks'
import { fetchDashboardData } from '@/redux/slices/dashboardSlice'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// Component Imports
import WelcomeBanner from './WelcomeBanner'
import CardStatsWithAreaChart from '@/components/card-statistics/StatsWithAreaChart'
import CardStatsSquare from '@/components/card-statistics/CardStatsSquare'
import PipelineContactsChart from './PipelineContactsChart'

// Service Imports
import dashboardService from '@/services/dashboardService'
import usePermissions from '@/hooks/usePermissions'
import { userMethods } from '@/utils/userMethods'
import { useSocket } from '@/contexts/SocketContext'

// Util Imports
import { formatCurrency } from '@/utils/format'

const HighImpactDashboard = () => {
    // Hooks
    const { hasModule } = usePermissions()
    const dispatch = useAppDispatch()
    const { socket, subscribeDashboard, unsubscribeDashboard } = useSocket()
    const { stats, loading, error } = useAppSelector(state => state.dashboard)
    const [salesChart, setSalesChart] = useState<any>(null)
 
    useEffect(() => {
        const user = userMethods.getUserLogin()
        const currentCompanyId = user?.activeCompanyId || user?.company_id
        
        // Cargar datos vía Redux
        dispatch(fetchDashboardData(currentCompanyId ? Number(currentCompanyId) : undefined))

        // Suscribir a actualizaciones del socket para el dashboard
        if (subscribeDashboard) {
            subscribeDashboard()
        }

        // Cargar gráfica de ventas (aún local o mover a redux después)
        const fetchSales = async () => {
            try {
                const salesData = await dashboardService.getSalesChart('7d')
                setSalesChart(salesData)
            } catch (err) {
                console.error('Error fetching sales chart:', err)
            }
        }
        fetchSales()

        return () => {
            if (unsubscribeDashboard) {
                unsubscribeDashboard()
            }
        }
    }, [dispatch])
 
    // Fallback series if API doesn't return enough data yet
    const mockSeriesUsers = [{ name: 'Usuarios', data: [10, 25, 15, 40, 20, 60, 50] }]
    const mockSeriesMessages = [{ name: 'Mensajes', data: [45, 52, 38, 65, 48, 82, 70] }]
    
    // Real or mock series for key metrics
    const ordersSeries = salesChart?.series?.find((s: any) => s.name === 'Pedidos') 
        ? [{ name: 'Pedidos', data: salesChart.series.find((s: any) => s.name === 'Pedidos')!.data }]
        : [{ name: 'Pedidos', data: [10, 12, 18, 15, 25, 19, 30] }]
        
    const revenueSeries = salesChart?.series?.find((s: any) => s.name === 'Ingresos')
        ? [{ name: 'Ingresos', data: salesChart.series.find((s: any) => s.name === 'Ingresos')!.data }]
        : [{ name: 'Ingresos', data: [1000, 2500, 1500, 4000, 3000, 6000, 5500] }]

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <WelcomeBanner />
            </Grid>

            {error && (
                <Grid item xs={12}>
                    <Alert severity='warning' variant='tonal'>{error}</Alert>
                </Grid>
            )}

            {loading && !stats ? (
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress size={60} thickness={4} />
                </Grid>
            ) : stats ? (
                <>
                    {/* Row 1: High Impact Key Metrics */}
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={formatCurrency(stats.totalRevenue || 0)}
                            title='Ingresos'
                            avatarIcon='tabler-currency-dollar'
                            avatarColor='primary'
                            chartSeries={revenueSeries}
                            chartColor='primary'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={(stats.totalOrders || 0).toString()}
                            title='Pedidos'
                            avatarIcon='tabler-shopping-cart'
                            avatarColor='success'
                            chartSeries={ordersSeries}
                            chartColor='success'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={(stats.totalCustomers || 0).toString()}
                            title='Contactos'
                            avatarIcon='tabler-users'
                            avatarColor='info'
                            chartSeries={mockSeriesUsers}
                            chartColor='info'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={(stats.totalMessagesToday || 0).toString()}
                            title='Mensajes Hoy'
                            avatarIcon='tabler-message-share'
                            avatarColor='warning'
                            chartSeries={mockSeriesMessages}
                            chartColor='warning'
                        />
                    </Grid>

                    {/* Row 2: Operation Status Indicators */}
                    <Grid item xs={12}>
                        <Typography variant='h5' sx={{ mb: 2, fontWeight: 600 }}>Estado de la Operación</Typography>
                        <Grid container spacing={6}>
                            <Grid item xs={6} sm={4} md={2}>
                                <CardStatsSquare
                                    avatarIcon='tabler-user-plus'
                                    avatarColor='success'
                                    stats={(stats.totalContactsToday || 0).toString()}
                                    statsTitle='Contactos Hoy'
                                    avatarSize={42}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2}>
                                <CardStatsSquare
                                    avatarIcon='tabler-message-2'
                                    avatarColor='primary'
                                    stats={(stats.activeConversations || 0).toString()}
                                    statsTitle='Chats Activos'
                                    avatarSize={42}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2}>
                                <CardStatsSquare
                                    avatarIcon='tabler-calendar-event'
                                    avatarColor='info'
                                    stats={(stats.pendingAppointments || 0).toString()}
                                    statsTitle='Citas'
                                    avatarSize={42}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2}>
                                <CardStatsSquare
                                    avatarIcon='tabler-megaphone'
                                    avatarColor='warning'
                                    stats={(stats.activeCampaigns || 0).toString()}
                                    statsTitle='Campañas'
                                    avatarSize={42}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2}>
                                <CardStatsSquare
                                    avatarIcon='tabler-file-description'
                                    avatarColor='secondary'
                                    stats={(stats.totalQuotes || 0).toString()}
                                    statsTitle='Cotizaciones'
                                    avatarSize={42}
                                />
                            </Grid>
                            <Grid item xs={6} sm={4} md={2}>
                                <CardStatsSquare
                                    avatarIcon='tabler-alert-triangle'
                                    avatarColor='error'
                                    stats={(stats.lowStockProducts || 0).toString()}
                                    statsTitle='Stock Bajo'
                                    avatarSize={42}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Funnel/Pipeline Chart */}
                    <Grid item xs={12}>
                        <PipelineContactsChart />
                    </Grid>
                </>
            ) : null}
        </Grid>
    )
}

export default HighImpactDashboard
