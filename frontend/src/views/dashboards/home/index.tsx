'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Icon Imports
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import PaymentIcon from '@mui/icons-material/Payment'
import ChatIcon from '@mui/icons-material/Chat'
import PersonIcon from '@mui/icons-material/Person'

// Component Imports
import StatCard from '@/components/dashboard/StatCard'
import WelcomeBanner from './WelcomeBanner'
import SalesChart from './SalesChart'
import RecentActivity from './RecentActivity'
import TopProducts from './TopProducts'
import ActiveConversations from './ActiveConversations'

// Hook Imports
import usePermissions from '@/hooks/usePermissions'

// Service Imports
import dashboardService from '@/services/dashboardService'
import type { DashboardStats } from '@/services/dashboardService'

// Utility Imports
import { formatCurrency } from '@/utils/format'

const HomeDashboard = () => {
    const { modules, loading: permissionsLoading, hasModule } = usePermissions()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setStatsLoading(true)
                const data = await dashboardService.getStats()
                setStats(data)
                setError(null)
            } catch (err) {
                console.error('Error fetching dashboard stats:', err)
                setError('Error al cargar las estadísticas del dashboard')
            } finally {
                setStatsLoading(false)
            }
        }

        if (!permissionsLoading) {
            fetchStats()
        }
    }, [permissionsLoading])

    const loading = permissionsLoading || statsLoading

    // Determine which widgets to show based on user's modules
    const showSalesStats = hasModule('VENTAS')
    const showAccountingStats = hasModule('CONTABILIDAD')
    const showHRStats = hasModule('RECURSOS_HUMANOS')
    const showCommunicationsStats = hasModule('COMUNICACIONES')
    const showMarketingStats = hasModule('MARKETING')

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        )
    }

    return (
        <Box>
            {/* Welcome Banner */}
            <Grid container spacing={6} sx={{ mb: 6 }}>
                <Grid item xs={12}>
                    <WelcomeBanner />
                </Grid>
            </Grid>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Stats Cards - Dynamic based on modules */}
            {!loading && stats && (
                <>
                    <Grid container spacing={4} sx={{ mb: 6 }}>
                        {/* Sales Module Stats */}
                        {showSalesStats && (
                            <>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard
                                        title="Ingresos del Mes"
                                        value={formatCurrency(stats.totalRevenue || 0)}
                                        change={stats.revenueChange}
                                        changeLabel="vs mes anterior"
                                        icon={<ShoppingCartIcon />}
                                        color="primary"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard
                                        title="Pedidos"
                                        value={stats.totalOrders || 0}
                                        change={stats.ordersChange}
                                        changeLabel="vs mes anterior"
                                        icon={<ReceiptIcon />}
                                        color="success"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard
                                        title="Clientes"
                                        value={stats.totalCustomers || 0}
                                        change={stats.customersChange}
                                        changeLabel="clientes nuevos"
                                        icon={<PeopleIcon />}
                                        color="info"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <StatCard
                                        title="Productos"
                                        value={stats.totalProducts || 0}
                                        change={stats.productsChange}
                                        changeLabel="en inventario"
                                        icon={<InventoryIcon />}
                                        color="warning"
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Accounting Module Stats */}
                        {showAccountingStats && (
                            <>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StatCard
                                        title="Facturas Emitidas"
                                        value={stats.totalInvoices || 0}
                                        change={stats.invoicesChange}
                                        changeLabel="este mes"
                                        icon={<ReceiptIcon />}
                                        color="primary"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StatCard
                                        title="Comprobantes Pendientes"
                                        value={stats.pendingQuotes || 0}
                                        icon={<AccountBalanceIcon />}
                                        color="warning"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <StatCard
                                        title="Stock Bajo"
                                        value={stats.lowStockProducts || 0}
                                        icon={<InventoryIcon />}
                                        color="error"
                                    />
                                </Grid>
                            </>
                        )}

                        {/* HR Module Stats */}
                        {showHRStats && (
                            <>
                                <Grid item xs={12} sm={6} md={6}>
                                    <StatCard
                                        title="Empleados Activos"
                                        value={stats.totalEmployees || 0}
                                        change={stats.employeesChange}
                                        changeLabel="este mes"
                                        icon={<PersonIcon />}
                                        color="info"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                    <StatCard
                                        title="Nómina del Mes"
                                        value={formatCurrency(stats.totalRevenue || 0)}
                                        icon={<PaymentIcon />}
                                        color="success"
                                    />
                                </Grid>
                            </>
                        )}

                        {/* Communications Module Stats */}
                        {showCommunicationsStats && (
                            <>
                                <Grid item xs={12} sm={6} md={6}>
                                    <StatCard
                                        title="Conversaciones Activas"
                                        value={stats.activeConversations || 0}
                                        icon={<ChatIcon />}
                                        color="primary"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                    <StatCard
                                        title="Mensajes del Día"
                                        value={1234}
                                        change={stats.messagesChange}
                                        changeLabel="vs ayer"
                                        icon={<ChatIcon />}
                                        color="success"
                                    />
                                </Grid>
                            </>
                        )}
                    </Grid>

                    {/* Charts and Activity - Dynamic based on modules */}
                    <Grid container spacing={6}>
                        {/* Sales Chart - Only for Sales module */}
                        {showSalesStats && (
                            <Grid item xs={12} md={8}>
                                <SalesChart />
                            </Grid>
                        )}

                        {/* Recent Activity - All users */}
                        <Grid item xs={12} md={showSalesStats ? 4 : 12}>
                            <RecentActivity />
                        </Grid>

                        {/* Top Products - Only for Sales module */}
                        {showSalesStats && (
                            <Grid item xs={12} md={6}>
                                <TopProducts />
                            </Grid>
                        )}

                        {/* Active Conversations - Only for Communications module */}
                        {showCommunicationsStats && (
                            <Grid item xs={12} md={6}>
                                <ActiveConversations />
                            </Grid>
                        )}
                    </Grid>

                    {/* No Modules Message */}
                    {modules.length === 0 && (
                        <Grid container spacing={6} sx={{ mt: 2 }}>
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    <Typography variant="h6" gutterBottom>
                                        Bienvenido a CloudFly
                                    </Typography>
                                    <Typography variant="body2">
                                        No tienes módulos asignados actualmente. Por favor contacta a tu administrador para
                                        obtener acceso a los módulos del sistema.
                                    </Typography>
                                </Alert>
                            </Grid>
                        </Grid>
                    )}
                </>
            )}
        </Box>
    )
}

export default HomeDashboard
