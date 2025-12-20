'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Box,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Divider,
    LinearProgress
} from '@mui/material'
import {
    TrendingUp as TrendingUpIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    AttachMoney as MoneyIcon,
    PieChart as ChartIcon,
    Download as DownloadIcon,
    Print as PrintIcon
} from '@mui/icons-material'

import type { PayrollCostByCostCenter, PayrollPeriod } from '@/types/hr'
import { getPayrollCostsByCostCenter } from '@/services/hr/payrollReportService'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'

// Format number as currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

// Format percentage
const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
}

// Color generator for cost centers
const getCostCenterColor = (index: number) => {
    const colors = [
        '#3b82f6', // blue
        '#10b981', // green
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#06b6d4', // cyan
        '#f97316', // orange
        '#ec4899', // pink
    ]
    return colors[index % colors.length]
}

export default function PayrollCostByCostCenterPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const periodIdParam = searchParams.get('periodId')
    const customerIdParam = searchParams.get('customerId')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [report, setReport] = useState<PayrollCostByCostCenter | null>(null)
    const [periods, setPeriods] = useState<PayrollPeriod[]>([])
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(
        periodIdParam ? parseInt(periodIdParam) : null
    )
    const customerId = customerIdParam ? parseInt(customerIdParam) : 1

    // Load periods on mount
    useEffect(() => {
        const loadPeriods = async () => {
            try {
                const response = await payrollPeriodService.getAll(customerId, 0, 50)
                // Filter to only show liquidated periods
                const liquidatedPeriods = response.content.filter(
                    p => p.status !== 'OPEN'
                )
                setPeriods(liquidatedPeriods)

                // Select first period if none selected
                if (!selectedPeriodId && liquidatedPeriods.length > 0) {
                    setSelectedPeriodId(liquidatedPeriods[0].id)
                }
            } catch (err) {
                console.error('Error loading periods:', err)
                setError('Error al cargar los períodos')
            }
        }
        loadPeriods()
    }, [customerId])

    // Load report when period changes
    useEffect(() => {
        const loadReport = async () => {
            if (!selectedPeriodId) return

            setLoading(true)
            setError(null)

            try {
                const data = await getPayrollCostsByCostCenter(selectedPeriodId, customerId)
                setReport(data)
            } catch (err) {
                console.error('Error loading report:', err)
                setError('Error al cargar el reporte')
            } finally {
                setLoading(false)
            }
        }
        loadReport()
    }, [selectedPeriodId, customerId])

    if (loading && !report) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        <ChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Costos de Nómina por Centro de Costo
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Análisis detallado de gastos de personal agrupados por área o departamento
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={() => window.print()}
                    >
                        Imprimir
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        disabled
                    >
                        Exportar Excel
                    </Button>
                </Box>
            </Box>

            {/* Period Selector */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Período de Nómina</InputLabel>
                                <Select
                                    value={selectedPeriodId || ''}
                                    label="Período de Nómina"
                                    onChange={(e) => setSelectedPeriodId(e.target.value as number)}
                                >
                                    {periods.map(period => (
                                        <MenuItem key={period.id} value={period.id}>
                                            {period.periodName} - {period.year}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {report && (
                            <>
                                <Grid item xs={6} md={2}>
                                    <Typography variant="caption" color="text.secondary">Tipo</Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        {report.periodType === 'MONTHLY' ? 'Mensual' :
                                            report.periodType === 'BIWEEKLY' ? 'Quincenal' : 'Semanal'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <Typography variant="caption" color="text.secondary">Período</Typography>
                                    <Typography variant="body1" fontWeight="500">
                                        #{report.periodNumber} / {report.periodYear}
                                    </Typography>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            )}

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            {report && (
                <>
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'primary.dark', color: 'white' }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                                Costo Total Empleador
                                            </Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {formatCurrency(report.summary.grandTotalEmployerCost)}
                                            </Typography>
                                        </Box>
                                        <MoneyIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'success.dark', color: 'white' }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                                Neto a Pagar
                                            </Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {formatCurrency(report.summary.grandTotalNetPay)}
                                            </Typography>
                                        </Box>
                                        <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'info.dark', color: 'white' }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                                Empleados
                                            </Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {report.summary.totalEmployees}
                                            </Typography>
                                        </Box>
                                        <PeopleIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ bgcolor: 'warning.dark', color: 'white' }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="overline" sx={{ opacity: 0.8 }}>
                                                Centros de Costo
                                            </Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {report.summary.totalCostCenters}
                                            </Typography>
                                        </Box>
                                        <BusinessIcon sx={{ fontSize: 40, opacity: 0.5 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Cost Distribution by Cost Center */}
                    <Card sx={{ mb: 4 }}>
                        <CardHeader
                            title="Distribución por Centro de Costo"
                            subheader="Porcentaje del costo total de nómina por área"
                        />
                        <CardContent>
                            <Grid container spacing={2}>
                                {report.costCenters.map((cc, index) => (
                                    <Grid item xs={12} key={cc.costCenterCode}>
                                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={cc.costCenterCode}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getCostCenterColor(index),
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                                <Typography variant="body1" fontWeight="500">
                                                    {cc.costCenterName}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    ({cc.employeeCount} empleados)
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {formatCurrency(cc.totalEmployerCost)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatPercent(cc.percentageOfTotal)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={cc.percentageOfTotal}
                                            sx={{
                                                height: 12,
                                                borderRadius: 1,
                                                bgcolor: 'grey.200',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: getCostCenterColor(index),
                                                    borderRadius: 1
                                                }
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Detailed Table */}
                    <Card>
                        <CardHeader
                            title="Detalle por Centro de Costo"
                            subheader="Desglose completo de devengos, deducciones y aportes patronales"
                        />
                        <CardContent sx={{ p: 0 }}>
                            <TableContainer component={Paper} elevation={0}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                                            <TableCell><strong>Centro de Costo</strong></TableCell>
                                            <TableCell align="right"><strong>Empleados</strong></TableCell>
                                            <TableCell align="right"><strong>Salarios</strong></TableCell>
                                            <TableCell align="right"><strong>Extras</strong></TableCell>
                                            <TableCell align="right"><strong>Aux. Transp.</strong></TableCell>
                                            <TableCell align="right"><strong>Seg. Social</strong></TableCell>
                                            <TableCell align="right"><strong>Parafiscales</strong></TableCell>
                                            <TableCell align="right"><strong>Provisiones</strong></TableCell>
                                            <TableCell align="right"><strong>Total Costo</strong></TableCell>
                                            <TableCell align="right"><strong>%</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {report.costCenters.map((cc, index) => (
                                            <TableRow
                                                key={cc.costCenterCode}
                                                sx={{ '&:hover': { bgcolor: 'grey.50' } }}
                                            >
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Box
                                                            sx={{
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: '50%',
                                                                bgcolor: getCostCenterColor(index)
                                                            }}
                                                        />
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="500">
                                                                {cc.costCenterName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {cc.costCenterCode}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="right">{cc.employeeCount}</TableCell>
                                                <TableCell align="right">{formatCurrency(cc.totalSalary)}</TableCell>
                                                <TableCell align="right">{formatCurrency(cc.totalOvertime)}</TableCell>
                                                <TableCell align="right">{formatCurrency(cc.totalTransport)}</TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(cc.totalEmployerHealth + cc.totalEmployerPension + cc.totalArl)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(cc.totalCaja + cc.totalIcbf + cc.totalSena)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(cc.totalCesantias + cc.totalPrima + cc.totalVacaciones)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                                                        {formatCurrency(cc.totalEmployerCost)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={formatPercent(cc.percentageOfTotal)}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Totals Row */}
                                        <TableRow sx={{ bgcolor: 'primary.dark' }}>
                                            <TableCell sx={{ color: 'white' }}>
                                                <strong>TOTALES</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{report.summary.totalEmployees}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{formatCurrency(report.summary.grandTotalSalary)}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{formatCurrency(report.summary.grandTotalOvertime)}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{formatCurrency(report.summary.grandTotalTransport)}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{formatCurrency(report.summary.grandTotalSeguridadSocial)}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{formatCurrency(report.summary.grandTotalParafiscales)}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{formatCurrency(report.summary.grandTotalProvisiones)}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>{formatCurrency(report.summary.grandTotalEmployerCost)}</strong>
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: 'white' }}>
                                                <strong>100%</strong>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Summary Breakdown */}
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardHeader title="Seguridad Social" />
                                <CardContent>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Salud (Empleador)</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalEmployerHealth)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Pensión (Empleador)</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalEmployerPension)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">ARL</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalArl)}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body1" fontWeight="bold">Total</Typography>
                                            <Typography variant="body1" fontWeight="bold" color="primary.main">
                                                {formatCurrency(report.summary.grandTotalSeguridadSocial)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardHeader title="Parafiscales" />
                                <CardContent>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Caja de Compensación</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalCaja)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">ICBF</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalIcbf)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">SENA</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalSena)}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body1" fontWeight="bold">Total</Typography>
                                            <Typography variant="body1" fontWeight="bold" color="primary.main">
                                                {formatCurrency(report.summary.grandTotalParafiscales)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardHeader title="Provisiones" />
                                <CardContent>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Cesantías</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalCesantias)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Prima de Servicios</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalPrima)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2">Vacaciones</Typography>
                                            <Typography variant="body2" fontWeight="500">
                                                {formatCurrency(report.summary.grandTotalVacaciones)}
                                            </Typography>
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body1" fontWeight="bold">Total</Typography>
                                            <Typography variant="body1" fontWeight="bold" color="primary.main">
                                                {formatCurrency(report.summary.grandTotalProvisiones)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}

            {!report && !loading && periods.length === 0 && (
                <Alert severity="info">
                    No hay períodos de nómina liquidados para generar el reporte.
                    Primero debe crear y liquidar un período de nómina.
                </Alert>
            )}
        </Box>
    )
}
