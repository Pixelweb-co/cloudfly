'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import WelcomeBanner from './WelcomeBanner'
import CardStatsWithAreaChart from '@/components/card-statistics/StatsWithAreaChart'
import CardStatsSquare from '@/components/card-statistics/CardStatsSquare'
import PipelineContactsChart from './PipelineContactsChart'

// Service Imports
import type { DashboardStats } from '@/services/dashboardService';
import dashboardService from '@/services/dashboardService'
import usePermissions from '@/hooks/usePermissions'
import { userMethods } from '@/utils/userMethods'

// Util Imports
import { formatCurrency } from '@/utils/format'

const HighImpactDashboard = () => {
    // Hooks
    const { hasModule } = usePermissions()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            const user = userMethods.getUserLogin()
            const currentCompanyId = user?.activeCompanyId || user?.company_id

            try {
                setLoading(true)
                const data = await dashboardService.getStats(currentCompanyId)

                setStats(data)
            } catch (err) {
                console.error('Error fetching dashboard stats:', err)
                setError('No se pudieron cargar las estadísticas. Mostrando datos de ejemplo.')

                // Mock data fallback if API fails
                setStats({
                    totalRevenue: 24500,
                    revenueChange: 12,
                    totalOrders: 156,
                    ordersChange: 8,
                    totalCustomers: 450,
                    customersChange: 15,
                    totalProducts: 89,
                    productsChange: -2,
                    activeConversations: 5,
                    messagesChange: 20
                })
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    // Provide default mock series for visual appeal since API doesn't return history yet
    const mockSeriesRequest = [{ name: 'Requests', data: [20, 40, 60, 40, 80, 20, 80] }]
    const mockSeriesSales = [{ name: 'Sales', data: [100, 120, 180, 150, 250, 190, 300] }]
    const mockSeriesUsers = [{ name: 'Users', data: [10, 25, 15, 40, 20, 60, 50] }]
    const mockSeriesRevenue = [{ name: 'Revenue', data: [1000, 2500, 1500, 4000, 3000, 6000, 5500] }]

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <WelcomeBanner />
            </Grid>

            {error && (
                <Grid item xs={12}>
                    <Alert severity='warning'>{error}</Alert>
                </Grid>
            )}

            {loading ? (
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Grid>
            ) : stats ? (
                <>
                    {/* Key Metrics Row - High Impact */}
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={formatCurrency(stats.totalRevenue || 0)}
                            title='Ingresos Totales'
                            avatarIcon='tabler-currency-dollar'
                            avatarSize={42}
                            avatarColor='primary'
                            chartSeries={mockSeriesRevenue}
                            chartColor='primary'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={(stats.totalOrders || 0).toString()}
                            title='Pedidos Totales'
                            avatarIcon='tabler-shopping-cart'
                            avatarSize={42}
                            avatarColor='success'
                            chartSeries={mockSeriesSales}
                            chartColor='success'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={(stats.totalCustomers || 0).toString()}
                            title='Clientes Activos'
                            avatarIcon='tabler-users'
                            avatarSize={42}
                            avatarColor='info'
                            chartSeries={mockSeriesUsers}
                            chartColor='info'
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <CardStatsWithAreaChart
                            stats={(stats.activeConversations || 0).toString()}
                            title='Conversaciones'
                            avatarIcon='tabler-message-2'
                            avatarSize={42}
                            avatarColor='warning'
                            chartSeries={mockSeriesRequest}
                            chartColor='warning'
                        />
                    </Grid>

                    {/* Secondary Metrics Row */}
                    <Grid item xs={6} sm={3} md={2}>
                        <CardStatsSquare
                            avatarIcon='tabler-box'
                            avatarColor='error'
                            stats={(stats.lowStockProducts || 0).toString()}
                            statsTitle='Stock Bajo'
                            avatarSize={42}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <CardStatsSquare
                            avatarIcon='tabler-file-invoice'
                            avatarColor='secondary'
                            stats={(stats.pendingQuotes || 0).toString()}
                            statsTitle='Pendientes'
                            avatarSize={42}
                        />
                    </Grid>
                    <Grid item xs={6} sm={3} md={2}>
                        <CardStatsSquare
                            avatarIcon='tabler-package'
                            avatarColor='primary'
                            stats={(stats.totalProducts || 0).toString()}
                            statsTitle='Productos'
                            avatarSize={42}
                        />
                    </Grid>

                    {/* Funnel/Pipeline Chart - High Impact Visualization */}
                    <Grid item xs={12}>
                        <PipelineContactsChart />
                    </Grid>
                </>
            ) : null}
        </Grid>
    )
}

export default HighImpactDashboard
