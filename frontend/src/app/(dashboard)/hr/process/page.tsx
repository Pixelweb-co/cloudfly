'use client'

import { useState, useEffect } from 'react'
import { PayrollPeriod, PayrollReceipt } from '@/types/hr'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
import { payrollProcessingService } from '@/services/hr/payrollProcessingService'
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Grid
} from '@mui/material'
import { PlayArrow, Check, Payment, Refresh } from '@mui/icons-material'

export default function ProcessPage() {
    const [periods, setPeriods] = useState<PayrollPeriod[]>([])
    const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null)
    const [activeStep, setActiveStep] = useState(0)
    const [receipts, setReceipts] = useState<PayrollReceipt[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const customerId = 1

    const steps = ['Seleccionar Periodo', 'Calcular Nómina', 'Aprobar', 'Pagar']

    useEffect(() => {
        loadPeriods()
    }, [])

    const loadPeriods = async () => {
        try {
            setLoading(true)
            const response = await payrollPeriodService.getAll(customerId, 0, 20)
            setPeriods(response.content.filter(p => p.status === 'OPEN' || p.status === 'CALCULATED' || p.status === 'APPROVED'))
        } catch (err) {
            setError('Error al cargar periodos')
        } finally {
            setLoading(false)
        }
    }

    const loadReceipts = async () => {
        if (!selectedPeriod) return
        try {
            const data = await payrollProcessingService.getReceipts(selectedPeriod.id, customerId)
            setReceipts(data)
        } catch (err) {
            setError('Error al cargar recibos')
        }
    }

    const processPayroll = async () => {
        if (!selectedPeriod) return
        try {
            setLoading(true)
            setError(null)
            await payrollProcessingService.processPeriod(selectedPeriod.id, customerId)
            await loadReceipts()
            setActiveStep(2)
        } catch (err) {
            setError('Error al procesar nómina')
        } finally {
            setLoading(false)
        }
    }

    const approvePayroll = async () => {
        if (!selectedPeriod) return
        try {
            setLoading(true)
            setError(null)
            await payrollProcessingService.approvePeriod(selectedPeriod.id, customerId)
            setActiveStep(3)
        } catch (err) {
            setError('Error al aprobar nómina')
        } finally {
            setLoading(false)
        }
    }

    const payPayroll = async () => {
        if (!selectedPeriod) return
        try {
            setLoading(true)
            setError(null)
            await payrollProcessingService.payPeriod(selectedPeriod.id, customerId)
            setActiveStep(4)
            await loadPeriods()
        } catch (err) {
            setError('Error al registrar pago')
        } finally {
            setLoading(false)
        }
    }

    const selectPeriod = (period: PayrollPeriod) => {
        setSelectedPeriod(period)
        setActiveStep(1)
        setReceipts([])
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)
    }

    return (
        <Box sx={{ p: 3 }}>
            <Card elevation={3}>
                <CardContent>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        💰 Procesar Nómina
                    </Typography>

                    <Stepper activeStep={activeStep} sx={{ my: 4 }}>
                        {steps.map(label => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {activeStep === 0 && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Selecciona un Periodo para Procesar</Typography>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : periods.length === 0 ? (
                                <Alert severity="info">No hay periodos disponibles para procesar</Alert>
                            ) : (
                                <Grid container spacing={2}>
                                    {periods.map(period => (
                                        <Grid item xs={12} md={6} key={period.id}>
                                            <Card
                                                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}
                                                onClick={() => selectPeriod(period)}
                                            >
                                                <CardContent>
                                                    <Typography variant="h6">{period.periodName}</Typography>
                                                    <Typography color="text.secondary">{period.description}</Typography>
                                                    <Box sx={{ mt: 2 }}>
                                                        <Chip label={period.status} color="info" size="small" />
                                                        <Chip label={`${period.workingDays} días`} sx={{ ml: 1 }} size="small" variant="outlined" />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}

                    {activeStep === 1 && selectedPeriod && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Procesarás la nómina para <strong>{selectedPeriod.periodName}</strong>
                            </Alert>
                            <Typography variant="body1" gutterBottom>
                                • Periodo: {selectedPeriod.startDate} al {selectedPeriod.endDate}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                • Días trabajados: {selectedPeriod.workingDays}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                                • Fecha de pago: {selectedPeriod.paymentDate}
                            </Typography>
                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                                    onClick={processPayroll}
                                    disabled={loading}
                                    size="large"
                                >
                                    {loading ? 'Procesando...' : 'Calcular Nómina'}
                                </Button>
                                <Button sx={{ ml: 2 }} onClick={() => setActiveStep(0)}>Cancelar</Button>
                            </Box>
                        </Box>
                    )}

                    {activeStep === 2 && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                ¡Nómina calculada exitosamente! Revisa los recibos generados.
                            </Alert>

                            {receipts.length > 0 && (
                                <>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                    <TableCell><strong>Empleado</strong></TableCell>
                                                    <TableCell align="right"><strong>Días</strong></TableCell>
                                                    <TableCell align="right"><strong>Percepciones</strong></TableCell>
                                                    <TableCell align="right"><strong>Deducciones</strong></TableCell>
                                                    <TableCell align="right"><strong>ISR</strong></TableCell>
                                                    <TableCell align="right"><strong>IMSS</strong></TableCell>
                                                    <TableCell align="right"><strong>NETO</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {receipts.map(receipt => (
                                                    <TableRow key={receipt.id} hover>
                                                        <TableCell>{receipt.employeeName}</TableCell>
                                                        <TableCell align="right">{receipt.regularDays}</TableCell>
                                                        <TableCell align="right" sx={{ color: 'success.main' }}>
                                                            {formatCurrency(receipt.totalPerceptions)}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ color: 'error.main' }}>
                                                            {formatCurrency(receipt.totalDeductions)}
                                                        </TableCell>
                                                        <TableCell align="right">{formatCurrency(receipt.isrAmount)}</TableCell>
                                                        <TableCell align="right">{formatCurrency(receipt.imssAmount)}</TableCell>
                                                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                            {formatCurrency(receipt.netPay)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                    <TableCell colSpan={2}><strong>TOTAL</strong></TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                        {formatCurrency(receipts.reduce((sum, r) => sum + r.totalPerceptions, 0))}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                        {formatCurrency(receipts.reduce((sum, r) => sum + r.totalDeductions, 0))}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                        {formatCurrency(receipts.reduce((sum, r) => sum + r.isrAmount, 0))}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                        {formatCurrency(receipts.reduce((sum, r) => sum + r.imssAmount, 0))}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                        {formatCurrency(receipts.reduce((sum, r) => sum + r.netPay, 0))}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Button
                                        variant="contained"
                                        startIcon={<Check />}
                                        onClick={approvePayroll}
                                        disabled={loading}
                                        size="large"
                                    >
                                        {loading ? 'Aprobando...' : 'Aprobar Nómina'}
                                    </Button>
                                    <Button sx={{ ml: 2 }} startIcon={<Refresh />} onClick={() => setActiveStep(0)}>
                                        Cancelar
                                    </Button>
                                </>
                            )}
                        </Box>
                    )}

                    {activeStep === 3 && (
                        <Box>
                            <Alert severity="success" sx={{ mb: 3 }}>
                                ¡Nómina aprobada! Procede a registrar el pago.
                            </Alert>
                            <Typography variant="body1" gutterBottom>
                                La nómina ha sido revisada y aprobada. Haz clic en el botón para registrar el pago a los empleados.
                            </Typography>
                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<Payment />}
                                    onClick={payPayroll}
                                    disabled={loading}
                                    size="large"
                                >
                                    {loading ? 'Registrando...' : 'Registrar Pago'}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {activeStep === 4 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h4" color="success.main" gutterBottom>
                                🎉 ¡Pago Registrado Exitosamente!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                La nómina del periodo <strong>{selectedPeriod?.periodName}</strong> ha sido pagada.
                            </Typography>
                            <Button variant="contained" onClick={() => window.location.reload()}>
                                Procesar Otro Periodo
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    )
}
