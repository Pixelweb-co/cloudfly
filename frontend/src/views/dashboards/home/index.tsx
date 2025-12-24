'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

// Icon Imports
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PeopleIcon from '@mui/icons-material/People'
import InventoryIcon from '@mui/icons-material/Inventory'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import PaymentIcon from '@mui/icons-material/Payment'
import ChatIcon from '@mui/icons-material/Chat'
import PersonIcon from '@mui/icons-material/Person'
import WarningIcon from '@mui/icons-material/Warning'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

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
    // usePermissions ya carga el menú con módulos de la suscripción
    const { modules, roles, menu, loading: permissionsLoading, hasModule } = usePermissions()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Obtener info del plan desde userData
    const [planInfo, setPlanInfo] = useState<{ planName: string; endDate: string } | null>(null)

    useEffect(() => {
        // Obtener información del plan desde localStorage
        const userDataStr = localStorage.getItem('userData')
        if (userDataStr) {
            try {
                const userData = JSON.parse(userDataStr)
                console.log('User data:', userData)
                // Intentar obtener info del plan si está disponible
                setPlanInfo({
                    planName: userData.subscription?.planName || 'Plan Activo',
                    endDate: userData.subscription?.endDate || ''
                })
            } catch (err) {
                console.error('Error parsing user data:', err)
            }
        }
    }, [])

    // Cargar estadísticas solo si tiene módulos
    useEffect(() => {
        const fetchStats = async () => {
            // Si no hay módulos, no cargar stats
            if (modules.length === 0 && !permissionsLoading) {
                setStatsLoading(false)
                return
            }

            try {
                setStatsLoading(true)
                const data = await dashboardService.getStats()
                console.log('Dashboard stats loaded:', data)
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
    }, [permissionsLoading, modules.length])

    const loading = permissionsLoading || statsLoading

    // Determine which widgets to show based on user's modules  
    const showSalesStats = hasModule('SALES') || hasModule('VENTAS')
    const showAccountingStats = hasModule('ACCOUNTING') || hasModule('CONTABILIDAD')
    const showHRStats = hasModule('HR') || hasModule('RECURSOS_HUMANOS')
    const showCommunicationsStats = hasModule('COMMUNICATIONS') || hasModule('COMUNICACIONES')

    console.log('Modules:', modules)
    console.log('Show sales:', showSalesStats)
    console.log('Show accounting:', showAccountingStats)
    console.log('Show HR:', showHRStats)
    console.log('Show communications:', showCommunicationsStats)

    // Error State
    if (error && modules.length > 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        )
    }

    // No Modules State (verificar solo después de cargar)
    if (!permissionsLoading && modules.length === 0 && menu.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Grid container spacing={6}>
                    <Grid item xs={12}>
                        <WelcomeBanner />
                    </Grid>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center', py: 8 }}>
                                <WarningIcon sx={{ fontSize: 80, color: 'warning.main', mb: 3 }} />
                                <Typography variant="h4" gutterBottom>
                                    No tienes módulos asignados actualmente
                                </Typography>
                                {planInfo && (
                                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                                        <strong>Plan:</strong> {planInfo.planName}
                                    </Typography>
                                )}
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                                    Por favor contacta a tu administrador para obtener acceso a los módulos del sistema.
                                </Typography>
                                <Button variant="contained" color="primary" size="large">
                                    Contactar Administrador
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
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

            {/* Subscription/Modules Info */}
            {!permissionsLoading && modules.length > 0 && (
                <Grid container spacing={6} sx={{ mb: 4 }}>
                    <Grid item xs={12}>
                        <Alert
                            severity="success"
                            icon={<CheckCircleIcon />}
                            sx={{
                                '& .MuiAlert-message': { width: '100%' }
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        {planInfo?.planName || 'Plan Activo'}
                                    </Typography>
                                    <Typography variant="body2">
                                        {modules.length} módulo{modules.length !== 1 ? 's' : ''} disponible{modules.length !== 1 ? 's' : ''}
                                        {modules.length > 0 && modules.length <= 5 && `: ${modules.join(', ')}`}
                                    </Typography>
                                </Box>
                                {planInfo?.endDate && (
                                    <Typography variant="caption" color="text.secondary">
                                        Activo hasta: {new Date(planInfo.endDate).toLocaleDateString()}
                                    </Typography>
                                )}
                            </Box>
                        </Alert>
                    </Grid>
                </Grid>
            )}

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
                </>
            )}
        </Box>
    )
}

export default HomeDashboard
