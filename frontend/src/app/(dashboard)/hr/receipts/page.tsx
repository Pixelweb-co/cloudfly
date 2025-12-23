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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Button,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Snackbar,
    TextField,
    InputAdornment,
    Stack,
    Divider,
    Grid
} from '@mui/material'
import {
    Download,
    Visibility,
    Email,
    Search,
    PictureAsPdf,
    Close,
    Send,
    CheckCircle,
    AttachMoney,
    Remove
} from '@mui/icons-material'

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function ReceiptsPage() {
    const [periods, setPeriods] = useState<PayrollPeriod[]>([])
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)
    const [receipts, setReceipts] = useState<PayrollReceipt[]>([])
    const [filteredReceipts, setFilteredReceipts] = useState<PayrollReceipt[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const customerId = 1

    // Modal states
    const [previewOpen, setPreviewOpen] = useState(false)
    const [selectedReceipt, setSelectedReceipt] = useState<PayrollReceipt | null>(null)
    const [sendingEmail, setSendingEmail] = useState(false)
    const [downloadingPdf, setDownloadingPdf] = useState(false)

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' })

    useEffect(() => {
        loadPeriods()
    }, [])

    useEffect(() => {
        if (selectedPeriodId) {
            loadReceipts()
        }
    }, [selectedPeriodId])

    useEffect(() => {
        if (searchTerm) {
            setFilteredReceipts(
                receipts.filter(r =>
                    r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
                )
            )
        } else {
            setFilteredReceipts(receipts)
        }
    }, [searchTerm, receipts])

    const loadPeriods = async () => {
        try {
            const response = await payrollPeriodService.getAll(customerId, 0, 50)
            setPeriods(response.content.filter(p => p.status !== 'OPEN'))
        } catch (error) {
            console.error('Error loading periods:', error)
        }
    }

    const loadReceipts = async () => {
        if (!selectedPeriodId) return
        try {
            setLoading(true)
            const data = await payrollProcessingService.getReceipts(selectedPeriodId, customerId)
            setReceipts(data)
            setFilteredReceipts(data)
        } catch (error) {
            console.error('Error loading receipts:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
            CALCULATED: 'info',
            APPROVED: 'warning',
            STAMPED: 'success',
            PAID: 'success',
            CANCELLED: 'error'
        }
        return colors[status] || 'default'
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            CALCULATED: 'Calculado',
            APPROVED: 'Aprobado',
            STAMPED: 'Timbrado',
            PAID: 'Pagado',
            CANCELLED: 'Cancelado'
        }
        return labels[status] || status
    }

    // Download PDF
    const handleDownloadPdf = async (receiptId: number, receiptNumber: string) => {
        try {
            setDownloadingPdf(true)
            const response = await fetch(`${API_BASE}/api/hr/payroll/receipts/${receiptId}/download-pdf`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) throw new Error('Error descargando PDF')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `colilla_${receiptNumber}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            setSnackbar({ open: true, message: 'PDF descargado exitosamente', severity: 'success' })
        } catch (error) {
            console.error('Error downloading PDF:', error)
            setSnackbar({ open: true, message: 'Error al descargar PDF', severity: 'error' })
        } finally {
            setDownloadingPdf(false)
        }
    }

    // Send email
    const handleSendEmail = async (receiptId: number, employeeName: string) => {
        try {
            setSendingEmail(true)
            const response = await fetch(`${API_BASE}/api/hr/payroll/receipts/${receiptId}/send-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error enviando email')
            }

            setSnackbar({ open: true, message: `Colilla enviada a ${employeeName}`, severity: 'success' })
        } catch (error: any) {
            console.error('Error sending email:', error)
            setSnackbar({ open: true, message: error.message || 'Error al enviar email', severity: 'error' })
        } finally {
            setSendingEmail(false)
        }
    }

    // Send all emails for period
    const handleSendAllEmails = async () => {
        if (!selectedPeriodId) return
        try {
            setSendingEmail(true)
            const response = await fetch(`${API_BASE}/api/hr/payroll/periods/${selectedPeriodId}/send-all-emails?customerId=${customerId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) throw new Error('Error enviando emails')

            const result = await response.json()
            setSnackbar({ open: true, message: result.message, severity: 'success' })
        } catch (error) {
            console.error('Error sending all emails:', error)
            setSnackbar({ open: true, message: 'Error al enviar colillas', severity: 'error' })
        } finally {
            setSendingEmail(false)
        }
    }

    // Open preview modal
    const handlePreview = (receipt: PayrollReceipt) => {
        setSelectedReceipt(receipt)
        setPreviewOpen(true)
    }

    return (
        <Box sx={{ p: 3 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            📄 Recibos de Nómina
                        </Typography>
                    </Box>

                    {/* Filters */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                        <FormControl sx={{ minWidth: 300 }}>
                            <InputLabel>Seleccionar Periodo</InputLabel>
                            <Select
                                value={selectedPeriodId || ''}
                                label="Seleccionar Periodo"
                                onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
                            >
                                {periods.map(period => (
                                    <MenuItem key={period.id} value={period.id}>
                                        {period.periodName} - {getStatusLabel(period.status)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {receipts.length > 0 && (
                            <TextField
                                placeholder="Buscar empleado o recibo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ minWidth: 250 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        )}
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                            <CircularProgress />
                        </Box>
                    ) : filteredReceipts.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography color="text.secondary" gutterBottom>
                                {selectedPeriodId ? 'No hay recibos para este periodo' : 'Selecciona un periodo para ver los recibos'}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                <Paper elevation={0} sx={{ p: 2, flex: 1, minWidth: 150, bgcolor: 'success.50', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Total Devengado</Typography>
                                    <Typography variant="h6" color="success.main" fontWeight="bold">
                                        {formatCurrency(filteredReceipts.reduce((sum, r) => sum + (r.totalPerceptions || 0), 0))}
                                    </Typography>
                                </Paper>
                                <Paper elevation={0} sx={{ p: 2, flex: 1, minWidth: 150, bgcolor: 'error.50', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Total Deducciones</Typography>
                                    <Typography variant="h6" color="error.main" fontWeight="bold">
                                        {formatCurrency(filteredReceipts.reduce((sum, r) => sum + (r.totalDeductions || 0), 0))}
                                    </Typography>
                                </Paper>
                                <Paper elevation={0} sx={{ p: 2, flex: 1, minWidth: 150, bgcolor: 'primary.50', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Neto a Pagar</Typography>
                                    <Typography variant="h6" color="primary" fontWeight="bold">
                                        {formatCurrency(filteredReceipts.reduce((sum, r) => sum + (r.netPay || 0), 0))}
                                    </Typography>
                                </Paper>
                                <Paper elevation={0} sx={{ p: 2, flex: 1, minWidth: 150, bgcolor: 'action.hover', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Empleados</Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {filteredReceipts.length}
                                    </Typography>
                                </Paper>
                            </Box>

                            {/* Table */}
                            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                            <TableCell><strong>#</strong></TableCell>
                                            <TableCell><strong>Empleado</strong></TableCell>
                                            <TableCell align="right"><strong>Días</strong></TableCell>
                                            <TableCell align="right"><strong>Salario Base</strong></TableCell>
                                            <TableCell align="right"><strong>Devengado</strong></TableCell>
                                            <TableCell align="right"><strong>Deducido</strong></TableCell>
                                            <TableCell align="right"><strong>Neto a Pagar</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                            <TableCell align="center"><strong>Acciones</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredReceipts.map((receipt, index) => (
                                            <TableRow
                                                key={receipt.id}
                                                hover
                                                sx={{
                                                    '&:hover': {
                                                        bgcolor: 'action.selected'
                                                    }
                                                }}
                                            >
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {receipt.employeeName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {receipt.receiptNumber}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">{receipt.regularDays}</TableCell>
                                                <TableCell align="right">{formatCurrency(receipt.baseSalary)}</TableCell>
                                                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                                                    {formatCurrency(receipt.totalPerceptions)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'medium' }}>
                                                    {formatCurrency(receipt.totalDeductions)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    {formatCurrency(receipt.netPay)}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={getStatusLabel(receipt.status)}
                                                        color={getStatusColor(receipt.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                                        <Tooltip title="Ver detalle">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handlePreview(receipt)}
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Descargar PDF">
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleDownloadPdf(receipt.id, receipt.receiptNumber)}
                                                                disabled={downloadingPdf}
                                                            >
                                                                <PictureAsPdf fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Enviar por WhatsApp/Email">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleSendEmail(receipt.id, receipt.employeeName)}
                                                                disabled={sendingEmail}
                                                            >
                                                                <Send fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Action Buttons */}
                            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Download />}
                                    disabled
                                >
                                    Descargar Todo (ZIP)
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={sendingEmail ? <CircularProgress size={20} /> : <Send />}
                                    onClick={handleSendAllEmails}
                                    disabled={sendingEmail}
                                    color="success"
                                >
                                    {sendingEmail ? 'Enviando...' : 'Enviar Notificaciones (WhatsApp/Email)'}
                                </Button>
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Preview Modal */}
            <Dialog
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    <Typography variant="h6" fontWeight="bold" color="inherit">
                        📄 Detalle de Nómina
                    </Typography>
                    <IconButton onClick={() => setPreviewOpen(false)} sx={{ color: 'white' }}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 4 }}>
                    {selectedReceipt && (
                        <Box>
                            {/* Header Info */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                                        {selectedReceipt.employeeName}
                                    </Typography>
                                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                                        <Chip label={`Recibo #${selectedReceipt.receiptNumber}`} size="small" variant="outlined" />
                                        <Typography variant="body2" color="text.secondary">
                                            Días trabajados: <strong>{selectedReceipt.regularDays}</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Salario Base: <strong>{formatCurrency(selectedReceipt.baseSalary)}</strong>
                                        </Typography>
                                    </Stack>
                                </Box>
                                <Chip
                                    label={getStatusLabel(selectedReceipt.status)}
                                    color={getStatusColor(selectedReceipt.status)}
                                    sx={{ px: 2, fontWeight: 'bold' }}
                                />
                            </Box>

                            <Divider sx={{ mb: 4 }} />

                            {/* Detailed Columns */}
                            <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
                                {/* DEVENGOS */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <AttachMoney /> Devengos
                                    </Typography>
                                    <Paper variant="outlined" sx={{ bgcolor: 'white' }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Sueldo Básico</TableCell>
                                                    <TableCell align="right">{formatCurrency(selectedReceipt.devengos?.salario || 0)}</TableCell>
                                                </TableRow>
                                                {selectedReceipt.devengos?.auxilioTransporte > 0 && (
                                                    <TableRow>
                                                        <TableCell>Auxilio de Transporte</TableCell>
                                                        <TableCell align="right">{formatCurrency(selectedReceipt.devengos.auxilioTransporte)}</TableCell>
                                                    </TableRow>
                                                )}
                                                {selectedReceipt.devengos?.horasExtras > 0 && (
                                                    <TableRow>
                                                        <TableCell>Horas Extras y Recargos</TableCell>
                                                        <TableCell align="right">{formatCurrency(selectedReceipt.devengos.horasExtras)}</TableCell>
                                                    </TableRow>
                                                )}
                                                {selectedReceipt.devengos?.bonos > 0 && (
                                                    <TableRow>
                                                        <TableCell>Bonificaciones</TableCell>
                                                        <TableCell align="right">{formatCurrency(selectedReceipt.devengos.bonos)}</TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow sx={{ bgcolor: 'success.50' }}>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>TOTAL DEVENGADO</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.dark', fontSize: '1.1rem' }}>
                                                        {formatCurrency(selectedReceipt.totalPerceptions)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Paper>
                                </Box>

                                {/* DEDUCCIONES */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ mb: 2, color: 'error.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Remove /> Deducciones
                                    </Typography>
                                    <Paper variant="outlined" sx={{ bgcolor: 'white' }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Salud (4%)</TableCell>
                                                    <TableCell align="right">{formatCurrency(selectedReceipt.deducciones?.health || 0)}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Pensión (4%)</TableCell>
                                                    <TableCell align="right">{formatCurrency(selectedReceipt.deducciones?.pension || 0)}</TableCell>
                                                </TableRow>
                                                {selectedReceipt.deducciones?.solidarityFund > 0 && (
                                                    <TableRow>
                                                        <TableCell>Fondo Solidaridad</TableCell>
                                                        <TableCell align="right">{formatCurrency(selectedReceipt.deducciones.solidarityFund)}</TableCell>
                                                    </TableRow>
                                                )}
                                                {selectedReceipt.deducciones?.loans > 0 && (
                                                    <TableRow>
                                                        <TableCell>Préstamos / Libranzas</TableCell>
                                                        <TableCell align="right">{formatCurrency(selectedReceipt.deducciones.loans)}</TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow sx={{ bgcolor: 'error.50' }}>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>TOTAL DEDUCIDO</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.dark', fontSize: '1.1rem' }}>
                                                        {formatCurrency(selectedReceipt.totalDeductions)}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </Paper>
                                </Box>
                            </Box>

                            {/* NETO FINAL */}
                            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" color="text.secondary">NETO A PAGAR:</Typography>
                                <Typography variant="h3" fontWeight="bold" color="primary.main">
                                    {formatCurrency(selectedReceipt.netPay)}
                                </Typography>
                            </Box>

                            {/* COSTOS EMPRESA (Informativo) */}
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Aportes y Provisiones Empresa (Costo Real)
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="body2" fontWeight="bold" gutterBottom>Seguridad Social Patronal</Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Salud (8.5%):</Typography>
                                                <Typography variant="body2">{formatCurrency(selectedReceipt.costosEmpleador?.health || 0)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Pensión (12%):</Typography>
                                                <Typography variant="body2">{formatCurrency(selectedReceipt.costosEmpleador?.pension || 0)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">ARL:</Typography>
                                                <Typography variant="body2">{formatCurrency(selectedReceipt.costosEmpleador?.arl || 0)}</Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper variant="outlined" sx={{ p: 2 }}>
                                            <Typography variant="body2" fontWeight="bold" gutterBottom>Provisiones Prestaciones</Typography>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Cesantías (8.33%):</Typography>
                                                <Typography variant="body2">{formatCurrency(selectedReceipt.provisiones?.severance || 0)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Prima (8.33%):</Typography>
                                                <Typography variant="body2">{formatCurrency(selectedReceipt.provisiones?.serviceBonus || 0)}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2">Vacaciones (4.17%):</Typography>
                                                <Typography variant="body2">{formatCurrency(selectedReceipt.provisiones?.vacations || 0)}</Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdf />}
                        onClick={() => selectedReceipt && handleDownloadPdf(selectedReceipt.id, selectedReceipt.receiptNumber)}
                    >
                        Descargar PDF
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Email />}
                        onClick={() => selectedReceipt && handleSendEmail(selectedReceipt.id, selectedReceipt.employeeName)}
                    >
                        Enviar por Email
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}
