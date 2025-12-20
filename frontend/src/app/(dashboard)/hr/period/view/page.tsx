'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
import { payrollLiquidationService } from '@/services/hr/payrollLiquidationService'
import { employeeService } from '@/services/hr/employeeService'
import { PayrollPeriod, Employee, PayrollReceipt } from '@/types/hr'
import ReceiptDetailView from '@/components/hr/ReceiptDetailView'
import {
    Card,
    CardHeader,
    CardContent,
    Button,
    Grid,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    LinearProgress
} from '@mui/material'
import {
    ArrowBack,
    Edit,
    CalendarMonth,
    People,
    AttachMoney,
    CheckCircle,
    Schedule,
    Payment,
    Receipt as ReceiptIcon,
    Send
} from '@mui/icons-material'

export default function PeriodViewPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const periodId = searchParams.get('id')

    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [period, setPeriod] = useState<PayrollPeriod | null>(null)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [receipts, setReceipts] = useState<PayrollReceipt[]>([])

    // Receipt View Dialog
    const [viewReceiptDialog, setViewReceiptDialog] = useState(false)
    const [receiptToView, setReceiptToView] = useState<PayrollReceipt | null>(null)

    const handleViewReceipt = (receipt: PayrollReceipt) => {
        setReceiptToView(receipt)
        setViewReceiptDialog(true)
    }

    const handleDownloadPdf = async (receiptId: number) => {
        try {
            const blob = await payrollLiquidationService.downloadReceiptPDF(receiptId, 1)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `recibo-${receiptId}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (err) {
            console.error(err)
            setError('Error al descargar PDF')
        }
    }

    // Payment dialog state
    const [paymentDialog, setPaymentDialog] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<PayrollReceipt | null>(null)
    const [paymentData, setPaymentData] = useState({
        paymentReference: '',
        paymentMethod: 'TRANSFER',
        notes: ''
    })

    useEffect(() => {
        if (periodId) {
            loadPeriodData()
        } else {
            setError('No se especificó un período')
            setLoading(false)
        }
    }, [periodId])

    const loadPeriodData = async () => {
        try {
            setLoading(true)
            const [periodData, empResponse] = await Promise.all([
                payrollPeriodService.getById(parseInt(periodId!), 1),
                employeeService.getAll(1, 0, 1000, true)
            ])
            setPeriod(periodData)

            // Filtrar empleados del período
            if (periodData.employeeIds && periodData.employeeIds.length > 0) {
                const periodEmployees = empResponse.content.filter(
                    (e: Employee) => periodData.employeeIds?.includes(e.id)
                )
                setEmployees(periodEmployees)
            }

            // Si está liquidado, cargar recibos
            if (periodData.status !== 'OPEN') {
                await loadReceipts()
            }
        } catch (err) {
            console.error('Error loading period:', err)
            setError('Error al cargar el período')
        } finally {
            setLoading(false)
        }
    }

    const loadReceipts = async () => {
        try {
            const receiptsData = await payrollLiquidationService.getReceiptsByPeriod(parseInt(periodId!), 1)
            setReceipts(receiptsData)
        } catch (err) {
            console.error('Error loading receipts:', err)
        }
    }

    const handleLiquidate = async () => {
        if (!period) return

        try {
            setProcessing(true)
            setError(null)

            const result = await payrollLiquidationService.liquidatePeriod(period.id, 1)

            setSuccess(`✅ Período liquidado: ${result.receiptsGenerated} recibos generados`)

            await loadPeriodData()
        } catch (err: any) {
            setError(err.message || 'Error al liquidar el período')
        } finally {
            setProcessing(false)
        }
    }

    const handleOpenPaymentDialog = (receipt: PayrollReceipt) => {
        setSelectedReceipt(receipt)
        setPaymentData({
            paymentReference: `TRX-${new Date().getTime()}`,
            paymentMethod: 'TRANSFER',
            notes: ''
        })
        setPaymentDialog(true)
    }

    const handlePayReceipt = async () => {
        if (!selectedReceipt) return

        try {
            setProcessing(true)
            setError(null)

            const result = await payrollLiquidationService.payReceipt(
                selectedReceipt.id,
                1,
                paymentData
            )

            setSuccess(`✅ Pago exitoso: ${selectedReceipt?.employeeName}`)

            await loadPeriodData()
            setPaymentDialog(false)
            setSelectedReceipt(null)
        } catch (err: any) {
            setError(err.message || 'Error al procesar el pago')
        } finally {
            setProcessing(false)
        }
    }

    // ============ CONFIGURACIÓN DE NÓMINA (ORIGINAL) ============
    const config = {
        minimumWage: 1423500,
        transportAllowance: 200000,
        healthPercentageEmployee: 4,
        pensionPercentageEmployee: 4,
        healthPercentageEmployer: 8.5,
        pensionPercentageEmployer: 12,
        parafiscalCajaPercentage: 4,
        parafiscalSenaPercentage: 2,
        parafiscalIcbfPercentage: 3,
        primaPercentage: 8.33,
        cesantiasPercentage: 8.33,
        interesesCesantiasPercentage: 12,
        vacacionesPercentage: 4.17
    }

    const ARL_PERCENTAGES: Record<string, number> = {
        'RIESGO_I': 0.522,
        'RIESGO_II': 1.044,
        'RIESGO_III': 2.436,
        'RIESGO_IV': 4.350,
        'RIESGO_V': 6.960
    }

    const calculatePeriodDays = () => {
        if (!period?.startDate || !period?.endDate) return 30
        const start = new Date(period.startDate)
        const end = new Date(period.endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    const periodDays = calculatePeriodDays()
    const DAYS_IN_MONTH = 30

    const calculatePayroll = (emp: Employee) => {
        const salarioMensual = emp.baseSalary || 0
        const factorPeriodo = periodDays / DAYS_IN_MONTH
        const salarioPeriodo = salarioMensual * factorPeriodo

        const aplicaAuxTransporte = (emp.hasTransportAllowance !== false) && (salarioMensual <= config.minimumWage * 2)
        const auxilioTransporte = aplicaAuxTransporte ? (config.transportAllowance * factorPeriodo) : 0

        const baseCalculo = salarioPeriodo
        const saludEmpleado = baseCalculo * (config.healthPercentageEmployee / 100)
        const pensionEmpleado = baseCalculo * (config.pensionPercentageEmployee / 100)
        const totalDeducciones = saludEmpleado + pensionEmpleado
        const netoPagar = salarioPeriodo + auxilioTransporte - totalDeducciones

        const saludEmpleador = baseCalculo * (config.healthPercentageEmployer / 100)
        const pensionEmpleador = baseCalculo * (config.pensionPercentageEmployer / 100)
        const arlRiskLevel = emp.arlRiskLevel || 'RIESGO_I'
        const arlPercentage = ARL_PERCENTAGES[arlRiskLevel] || 0.522
        const arl = baseCalculo * (arlPercentage / 100)
        const cajaCompensacion = baseCalculo * (config.parafiscalCajaPercentage / 100)
        const icbf = baseCalculo * (config.parafiscalIcbfPercentage / 100)
        const sena = baseCalculo * (config.parafiscalSenaPercentage / 100)
        const totalAportesEmpleador = saludEmpleador + pensionEmpleador + arl + cajaCompensacion + icbf + sena

        const baseProvisiones = salarioPeriodo + auxilioTransporte
        const prima = baseProvisiones * (config.primaPercentage / 100)
        const cesantias = baseProvisiones * (config.cesantiasPercentage / 100)
        const interesesCesantias = cesantias * (config.interesesCesantiasPercentage / 100 / 12)
        const vacaciones = salarioPeriodo * (config.vacacionesPercentage / 100)
        const totalProvisiones = prima + cesantias + interesesCesantias + vacaciones

        const costoTotal = salarioPeriodo + auxilioTransporte + totalAportesEmpleador + totalProvisiones

        return {
            salarioMensual, salarioPeriodo, auxilioTransporte,
            saludEmpleado, pensionEmpleado, totalDeducciones, netoPagar,
            saludEmpleador, pensionEmpleador, arl, cajaCompensacion, icbf, sena,
            totalAportesEmpleador, prima, cesantias, interesesCesantias,
            vacaciones, totalProvisiones, costoTotal
        }
    }

    const calculateTotals = () => {
        let totalSalarios = 0, totalAuxTransporte = 0, totalDeducciones = 0
        let totalNeto = 0, totalAportesEmpleador = 0, totalProvisiones = 0, costoTotal = 0

        employees.forEach(emp => {
            const p = calculatePayroll(emp)
            totalSalarios += p.salarioPeriodo
            totalAuxTransporte += p.auxilioTransporte
            totalDeducciones += p.totalDeducciones
            totalNeto += p.netoPagar
            totalAportesEmpleador += p.totalAportesEmpleador
            totalProvisiones += p.totalProvisiones
            costoTotal += p.costoTotal
        })

        return { totalSalarios, totalAuxTransporte, totalDeducciones, totalNeto, totalAportesEmpleador, totalProvisiones, costoTotal }
    }

    const totals = calculateTotals()

    const calculateProgress = () => {
        if (receipts.length === 0) return 0
        const paidCount = receipts.filter(r => r.status === 'PAID').length
        return (paidCount / receipts.length) * 100
    }

    const calculateReceiptTotals = () => {
        const totalNet = receipts.reduce((sum, r) => sum + r.netPay, 0)
        const totalPaid = receipts.filter(r => r.status === 'PAID').reduce((sum, r) => sum + r.netPay, 0)
        const totalPending = totalNet - totalPaid
        const paidCount = receipts.filter(r => r.status === 'PAID').length

        return { totalNet, totalPaid, totalPending, paidCount, totalCount: receipts.length }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const getStatusColor = (status: string): 'info' | 'warning' | 'success' | 'default' => {
        const colors: Record<string, 'info' | 'warning' | 'success' | 'default'> = {
            OPEN: 'info', LIQUIDATED: 'warning', PARTIALLY_PAID: 'warning', PAID: 'success', CLOSED: 'default'
        }
        return colors[status] || 'default'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            OPEN: 'Activo', LIQUIDATED: 'Liquidado', PARTIALLY_PAID: 'Pago Parcial', PAID: 'Pagado', CLOSED: 'Cerrado'
        }
        return labels[status] || status
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        )
    }

    if (error && !period) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                <Button sx={{ mt: 2 }} onClick={() => router.push('/hr/periods')}>Volver</Button>
            </Box>
        )
    }

    const receiptTotals = calculateReceiptTotals()
    const progress = calculateProgress()

    return (
        <Box sx={{ p: 3 }}>
            {/* Alerts */}
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.push('/hr/periods')}>
                        Volver
                    </Button>
                    <Typography variant="h4" fontWeight="bold">
                        📊 {period?.periodName}
                    </Typography>
                    <Chip
                        icon={period?.status === 'OPEN' ? <Schedule /> : <CheckCircle />}
                        label={getStatusLabel(period?.status || '')}
                        color={getStatusColor(period?.status || '')}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {period?.status === 'OPEN' && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => router.push(`/hr/period/form?id=${period.id}`)}
                            >
                                Editar Período
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AttachMoney />}
                                onClick={handleLiquidate}
                                disabled={processing}
                            >
                                {processing ? 'Liquidando...' : '💰 Liquidar Período'}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Info del Período */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader avatar={<CalendarMonth color="primary" />} title="Información del Período" />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Fecha Inicio</Typography>
                                    <Typography variant="body1" fontWeight="bold">{formatDate(period?.startDate || '')}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Fecha Fin</Typography>
                                    <Typography variant="body1" fontWeight="bold">{formatDate(period?.endDate || '')}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Fecha de Pago</Typography>
                                    <Typography variant="body1" fontWeight="bold">{formatDate(period?.paymentDate || '')}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="caption" color="text.secondary">Días del Período</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="primary">{periodDays} días</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Progress (solo si está liquidado) */}
                {period?.status !== 'OPEN' && receipts.length > 0 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader avatar={<Payment color="primary" />} title="Progreso de Pagos" />
                            <CardContent>
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {receiptTotals.paidCount} de {receiptTotals.totalCount} empleados pagados
                                        </Typography>
                                        <Typography variant="body2" fontWeight="bold">{Math.round(progress)}%</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'info.light', textAlign: 'center' }}>
                                            <Typography variant="subtitle2" color="info.dark">💼 TOTAL</Typography>
                                            <Typography variant="h5" fontWeight="bold" color="info.dark">
                                                {formatCurrency(receiptTotals.totalNet)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
                                            <Typography variant="subtitle2" color="success.dark">✅ PAGADO</Typography>
                                            <Typography variant="h5" fontWeight="bold" color="success.dark">
                                                {formatCurrency(receiptTotals.totalPaid)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Paper elevation={2} sx={{ p: 2, bgcolor: 'warning.light', textAlign: 'center' }}>
                                            <Typography variant="subtitle2" color="warning.dark">⏳ PENDIENTE</Typography>
                                            <Typography variant="h5" fontWeight="bold" color="warning.dark">
                                                {formatCurrency(receiptTotals.totalPending)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Tabla de Recibos (si está liquidado) */}
                {period?.status !== 'OPEN' && receipts.length > 0 ? (
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader avatar={<People color="primary" />} title={`Recibos de Pago (${receipts.length})`} />
                            <CardContent>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                <TableCell><strong>Empleado</strong></TableCell>
                                                <TableCell align="right"><strong>Neto a Pagar</strong></TableCell>
                                                <TableCell align="center"><strong>Estado</strong></TableCell>
                                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {receipts.map(receipt => (
                                                <TableRow key={receipt.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold">{receipt.employeeName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{receipt.receiptNumber}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body1" fontWeight="bold" color="success.main">
                                                            {formatCurrency(receipt.netPay)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            size="small"
                                                            label={receipt.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                                            color={receipt.status === 'PAID' ? 'success' : 'warning'}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {receipt.status === 'PENDING' ? (
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                startIcon={<Payment />}
                                                                onClick={() => handleOpenPaymentDialog(receipt)}
                                                                disabled={processing}
                                                            >
                                                                Pagar
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<ReceiptIcon />}
                                                                onClick={() => handleViewReceipt(receipt)}
                                                            >
                                                                Ver Recibo
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                ) : (
                    /* Tabla de Empleados y Cálculos (vista original - OPEN) */
                    <>
                        <Grid item xs={12}>
                            <Card>
                                <CardHeader avatar={<People color="primary" />} title={`Empleados del Período (${employees.length})`} />
                                <CardContent>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell><strong>Empleado</strong></TableCell>
                                                    <TableCell align="right"><strong>Salario Período</strong></TableCell>
                                                    <TableCell align="right"><strong>Aux. Transporte</strong></TableCell>
                                                    <TableCell align="right"><strong>Deducciones</strong></TableCell>
                                                    <TableCell align="right"><strong>Neto a Pagar</strong></TableCell>
                                                    <TableCell align="right"><strong>Aportes Empresa</strong></TableCell>
                                                    <TableCell align="right"><strong>Provisiones</strong></TableCell>
                                                    <TableCell align="right"><strong>Costo Total</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {employees.map(emp => {
                                                    const p = calculatePayroll(emp)
                                                    return (
                                                        <TableRow key={emp.id} hover>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight="bold">{emp.fullName}</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {emp.nationalId} • {emp.jobTitle}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">{formatCurrency(p.salarioPeriodo)}</TableCell>
                                                            <TableCell align="right">{formatCurrency(p.auxilioTransporte)}</TableCell>
                                                            <TableCell align="right" sx={{ color: 'error.main' }}>
                                                                -{formatCurrency(p.totalDeducciones)}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                                {formatCurrency(p.netoPagar)}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: 'warning.main' }}>
                                                                {formatCurrency(p.totalAportesEmpleador)}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ color: 'info.main' }}>
                                                                {formatCurrency(p.totalProvisiones)}
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                                {formatCurrency(p.costoTotal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                })}
                                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                                    <TableCell><strong>TOTALES</strong></TableCell>
                                                    <TableCell align="right"><strong>{formatCurrency(totals.totalSalarios)}</strong></TableCell>
                                                    <TableCell align="right"><strong>{formatCurrency(totals.totalAuxTransporte)}</strong></TableCell>
                                                    <TableCell align="right" sx={{ color: 'error.main' }}>
                                                        <strong>-{formatCurrency(totals.totalDeducciones)}</strong>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: 'success.main' }}>
                                                        <strong>{formatCurrency(totals.totalNeto)}</strong>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: 'warning.main' }}>
                                                        <strong>{formatCurrency(totals.totalAportesEmpleador)}</strong>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ color: 'info.main' }}>
                                                        <strong>{formatCurrency(totals.totalProvisiones)}</strong>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <strong>{formatCurrency(totals.costoTotal)}</strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Resumen */}
                        <Grid item xs={12}>
                            <Card sx={{ bgcolor: 'grey.50' }}>
                                <CardHeader avatar={<AttachMoney color="success" />} title="Resumen de Liquidación" />
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={4}>
                                            <Paper elevation={2} sx={{ p: 2, bgcolor: 'success.light', textAlign: 'center' }}>
                                                <Typography variant="subtitle2" color="success.dark">💰 TOTAL DEVENGADO</Typography>
                                                <Typography variant="h4" fontWeight="bold" color="success.dark">
                                                    {formatCurrency(totals.totalSalarios + totals.totalAuxTransporte)}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Paper elevation={2} sx={{ p: 2, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
                                                <Typography variant="subtitle2">💵 NETO A PAGAR</Typography>
                                                <Typography variant="h4" fontWeight="bold">{formatCurrency(totals.totalNeto)}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <Paper elevation={2} sx={{ p: 2, bgcolor: 'secondary.main', color: 'white', textAlign: 'center' }}>
                                                <Typography variant="subtitle2">💼 COSTO TOTAL EMPRESA</Typography>
                                                <Typography variant="h4" fontWeight="bold">{formatCurrency(totals.costoTotal)}</Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </>
                )}
            </Grid>

            {/* Payment Dialog */}
            <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>💰 Registrar Pago - {selectedReceipt?.employeeName}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="h6" color="success.main" gutterBottom>
                            Monto: {selectedReceipt && formatCurrency(selectedReceipt.netPay)}
                        </Typography>
                        <Divider sx={{ my: 2 }} />

                        <TextField
                            fullWidth
                            label="Referencia de Pago"
                            value={paymentData.paymentReference}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentReference: e.target.value })}
                            required
                            sx={{ mb: 2 }}
                            helperText="Ej: TRX-12345, Transferencia Bancolombia"
                        />

                        <TextField
                            fullWidth
                            select
                            label="Método de Pago"
                            value={paymentData.paymentMethod}
                            onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                            SelectProps={{ native: true }}
                            sx={{ mb: 2 }}
                        >
                            <option value="TRANSFER">Transferencia Bancaria</option>
                            <option value="CASH">Efectivo</option>
                            <option value="CHECK">Cheque</option>
                        </TextField>

                        <TextField
                            fullWidth
                            label="Notas (Opcional)"
                            value={paymentData.notes}
                            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                            multiline
                            rows={3}
                        />

                        <Alert severity="info" sx={{ mt: 2 }}>
                            📱 Se enviará notificación por WhatsApp al empleado
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialog(false)} disabled={processing}>Cancelar</Button>
                    <Button
                        variant="contained"
                        startIcon={processing ? <CircularProgress size={20} /> : <Send />}
                        onClick={handlePayReceipt}
                        disabled={processing || !paymentData.paymentReference}
                    >
                        {processing ? 'Procesando...' : 'Confirmar Pago'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Receipt Dialog */}
            <Dialog
                open={viewReceiptDialog}
                onClose={() => setViewReceiptDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Detalle de Recibo</Typography>
                    <Button onClick={() => setViewReceiptDialog(false)} sx={{ minWidth: 'auto', p: 0.5 }}>❌</Button>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {receiptToView && (
                        <ReceiptDetailView
                            receipt={receiptToView}
                            onDownloadPdf={handleDownloadPdf}
                            onPay={receiptToView.status === 'PENDING' ? () => {
                                setViewReceiptDialog(false)
                                handleOpenPaymentDialog(receiptToView)
                            } : undefined}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewReceiptDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
