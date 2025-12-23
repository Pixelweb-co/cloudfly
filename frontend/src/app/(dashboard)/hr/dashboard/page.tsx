'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Avatar,
    LinearProgress,
    Chip,
    Button,
    Divider,
    IconButton,
    Tooltip,
    Paper,
    Stack
} from '@mui/material'
import {
    TrendingUp,
    TrendingDown,
    People,
    AttachMoney,
    LocalHospital,
    AccountBalance,
    CalendarMonth,
    Receipt,
    ArrowForward,
    Refresh,
    Warning,
    CheckCircle
} from '@mui/icons-material'

// Tipos
interface DashboardStats {
    totalEmployees: number
    activeEmployees: number
    totalPayroll: number
    previousPayroll: number
    socialSecurity: number
    parafiscales: number
    pendingPeriods: number
    processedPeriods: number
}

interface PayrollAlert {
    id: number
    type: 'warning' | 'info' | 'success'
    message: string
    date: string
}

export default function HRDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        totalEmployees: 0,
        activeEmployees: 0,
        totalPayroll: 0,
        previousPayroll: 0,
        socialSecurity: 0,
        parafiscales: 0,
        pendingPeriods: 0,
        processedPeriods: 0
    })

    const [alerts] = useState<PayrollAlert[]>([
        { id: 1, type: 'warning', message: 'Prima de servicios vence el 20 de diciembre', date: '2025-12-20' },
        { id: 2, type: 'info', message: 'Cesantías deben consignarse antes del 14 de febrero', date: '2025-02-14' },
        { id: 3, type: 'success', message: 'Nómina de noviembre procesada correctamente', date: '2025-11-30' }
    ])

    const [recentPayrolls] = useState([
        { period: 'Dic 2024 - Quincena 1', total: 12500000, employees: 15, status: 'PAID' },
        { period: 'Nov 2024 - Quincena 2', total: 12300000, employees: 15, status: 'PAID' },
        { period: 'Nov 2024 - Quincena 1', total: 11800000, employees: 14, status: 'PAID' },
    ])

    useEffect(() => {
        // Simular carga de datos
        setTimeout(() => {
            setStats({
                totalEmployees: 18,
                activeEmployees: 15,
                totalPayroll: 12500000,
                previousPayroll: 12300000,
                socialSecurity: 2100000,
                parafiscales: 560000,
                pendingPeriods: 1,
                processedPeriods: 24
            })
            setLoading(false)
        }, 1000)
    }, [])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    const getPercentageChange = () => {
        if (stats.previousPayroll === 0) return 0
        return ((stats.totalPayroll - stats.previousPayroll) / stats.previousPayroll * 100).toFixed(1)
    }

    const isPositiveChange = Number(getPercentageChange()) >= 0

    // Widget Card Component
    const StatCard = ({
        title,
        value,
        subtitle,
        icon,
        color,
        trend
    }: {
        title: string
        value: string
        subtitle?: string
        icon: React.ReactNode
        color: string
        trend?: { value: string, positive: boolean }
    }) => (
        <Card
            elevation={0}
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                border: `1px solid ${color}30`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${color}20`
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, color }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                        {trend && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                {trend.positive ? (
                                    <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                                ) : (
                                    <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                                )}
                                <Typography
                                    variant="caption"
                                    color={trend.positive ? 'success.main' : 'error.main'}
                                    fontWeight={600}
                                >
                                    {trend.value} vs mes anterior
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Avatar
                        sx={{
                            bgcolor: `${color}20`,
                            color: color,
                            width: 56,
                            height: 56
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <Box sx={{ p: 3 }}>
                <LinearProgress sx={{ borderRadius: 2 }} />
                <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
                    Cargando dashboard...
                </Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        📊 Dashboard de Nómina
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Resumen general de recursos humanos y nómina
                    </Typography>
                </Box>
                <Box>
                    <Tooltip title="Actualizar datos">
                        <IconButton onClick={() => window.location.reload()}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="contained"
                        startIcon={<Receipt />}
                        onClick={() => router.push('/hr/process')}
                        sx={{ ml: 1 }}
                    >
                        Procesar Nómina
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Nómina del Mes"
                        value={formatCurrency(stats.totalPayroll)}
                        icon={<AttachMoney sx={{ fontSize: 28 }} />}
                        color="#00897B"
                        trend={{
                            value: `${isPositiveChange ? '+' : ''}${getPercentageChange()}%`,
                            positive: isPositiveChange
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Seguridad Social"
                        value={formatCurrency(stats.socialSecurity)}
                        subtitle="Salud + Pensión + ARL"
                        icon={<LocalHospital sx={{ fontSize: 28 }} />}
                        color="#2196F3"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Parafiscales"
                        value={formatCurrency(stats.parafiscales)}
                        subtitle="SENA + ICBF + CCF"
                        icon={<AccountBalance sx={{ fontSize: 28 }} />}
                        color="#9C27B0"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Empleados Activos"
                        value={`${stats.activeEmployees}`}
                        subtitle={`de ${stats.totalEmployees} totales`}
                        icon={<People sx={{ fontSize: 28 }} />}
                        color="#FF9800"
                    />
                </Grid>
            </Grid>

            {/* Second Row */}
            <Grid container spacing={3}>
                {/* Alertas */}
                <Grid item xs={12} lg={6}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    🔔 Alertas y Recordatorios
                                </Typography>
                            </Box>
                            <Stack spacing={2}>
                                {alerts.map((alert) => (
                                    <Paper
                                        key={alert.id}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            bgcolor: alert.type === 'warning' ? 'warning.50' :
                                                alert.type === 'success' ? 'success.50' : 'info.50',
                                            borderLeft: 4,
                                            borderColor: alert.type === 'warning' ? 'warning.main' :
                                                alert.type === 'success' ? 'success.main' : 'info.main',
                                            borderRadius: 1
                                        }}
                                    >
                                        {alert.type === 'warning' ? (
                                            <Warning color="warning" />
                                        ) : alert.type === 'success' ? (
                                            <CheckCircle color="success" />
                                        ) : (
                                            <CalendarMonth color="info" />
                                        )}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>
                                                {alert.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(alert.date).toLocaleDateString('es-CO', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Últimas Nóminas */}
                <Grid item xs={12} lg={6}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    📋 Últimas Nóminas Procesadas
                                </Typography>
                                <Button
                                    size="small"
                                    endIcon={<ArrowForward />}
                                    onClick={() => router.push('/hr/receipts')}
                                >
                                    Ver todas
                                </Button>
                            </Box>
                            <Stack spacing={2}>
                                {recentPayrolls.map((payroll, index) => (
                                    <Paper
                                        key={index}
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            bgcolor: 'action.hover',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                bgcolor: 'action.selected'
                                            }
                                        }}
                                        onClick={() => router.push('/hr/receipts')}
                                    >
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {payroll.period}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {payroll.employees} empleados
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="body1" fontWeight="bold" color="primary">
                                                {formatCurrency(payroll.total)}
                                            </Typography>
                                            <Chip
                                                label={payroll.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                                size="small"
                                                color={payroll.status === 'PAID' ? 'success' : 'warning'}
                                                sx={{ fontSize: '0.7rem' }}
                                            />
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Accesos Rápidos */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    ⚡ Accesos Rápidos
                </Typography>
                <Grid container spacing={2}>
                    {[
                        { label: 'Empleados', icon: '👥', href: '/hr/employees', color: '#00897B' },
                        { label: 'Procesar Nómina', icon: '💰', href: '/hr/process', color: '#2196F3' },
                        { label: 'Recibos', icon: '📄', href: '/hr/receipts', color: '#9C27B0' },
                        { label: 'Periodos', icon: '📅', href: '/hr/periods', color: '#FF9800' },
                        { label: 'Conceptos', icon: '📝', href: '/hr/concepts', color: '#F44336' },
                        { label: 'Configuración', icon: '⚙️', href: '/hr/config', color: '#607D8B' }
                    ].map((item) => (
                        <Grid item xs={6} sm={4} md={2} key={item.label}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 3,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: item.color,
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 12px ${item.color}30`
                                    }
                                }}
                                onClick={() => router.push(item.href)}
                            >
                                <Typography variant="h4" sx={{ mb: 1 }}>{item.icon}</Typography>
                                <Typography variant="body2" fontWeight={500}>{item.label}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Box>
    )
}
