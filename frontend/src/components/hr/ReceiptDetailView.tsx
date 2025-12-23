import React from 'react'
import { PayrollReceipt } from '@/types/hr'
import {
    Card,
    CardContent,
    Typography,
    Box,
    Grid,
    Divider,
    Button,
    Chip,
    Stack,
    IconButton,
    Tooltip,
    Paper
} from '@mui/material'
import {
    Download,
    Payment,
    MonetizationOn,
    LocalHospital,
    AccountBalanceWallet,
    ReceiptLong,
    CheckCircle,
    Warning
} from '@mui/icons-material'

interface ReceiptDetailViewProps {
    receipt: PayrollReceipt
    onDownloadPdf: (id: number) => void
    onPay?: (id: number) => void
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

export default function ReceiptDetailView({ receipt, onDownloadPdf, onPay }: ReceiptDetailViewProps) {
    const devengos = receipt.devengos || {
        salario: 0, horasExtras: 0, comisiones: 0, auxilioTransporte: 0, bonos: 0, otros: 0, total: 0
    }
    const deducciones = receipt.deducciones || {
        salud: 0, pension: 0, otras: 0, total: 0
    }

    return (
        <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
            {/* Header */}
            <Box sx={{
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white',
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2
            }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptLong /> {receipt.employeeName}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Recibo: {receipt.receiptNumber} | Período: {receipt.periodName}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        size="small"
                        startIcon={<Download />}
                        onClick={() => onDownloadPdf(receipt.id)}
                        sx={{ borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        PDF
                    </Button>
                    {receipt.status === 'PENDING' && onPay && (
                        <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<Payment />}
                            onClick={() => onPay(receipt.id)}
                        >
                            Pagar
                        </Button>
                    )}
                    {receipt.status === 'PAID' && (
                        <Chip
                            label="PAGADO"
                            color="success"
                            icon={<CheckCircle />}
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                    )}
                </Stack>
            </Box>

            <CardContent sx={{ p: 3 }}>
                <Grid container spacing={4}>
                    {/* Devengos */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="success.main" fontWeight="bold" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                            DEVENGOS (INGRESOS)
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Salario Básico</Typography>
                                <Typography variant="body2" fontWeight="medium">{formatCurrency(devengos.salario)}</Typography>
                            </Box>
                            {devengos.auxilioTransporte > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Auxilio Transporte</Typography>
                                    <Typography variant="body2" fontWeight="medium">{formatCurrency(devengos.auxilioTransporte)}</Typography>
                                </Box>
                            )}
                            {devengos.horasExtras > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Horas Extras</Typography>
                                    <Typography variant="body2" fontWeight="medium">{formatCurrency(devengos.horasExtras)}</Typography>
                                </Box>
                            )}
                            {devengos.comisiones > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Comisiones</Typography>
                                    <Typography variant="body2" fontWeight="medium">{formatCurrency(devengos.comisiones)}</Typography>
                                </Box>
                            )}
                            {devengos.bonos > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Bonos</Typography>
                                    <Typography variant="body2" fontWeight="medium">{formatCurrency(devengos.bonos)}</Typography>
                                </Box>
                            )}
                            {devengos.otros > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Otros</Typography>
                                    <Typography variant="body2" fontWeight="medium">{formatCurrency(devengos.otros)}</Typography>
                                </Box>
                            )}
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="subtitle1" fontWeight="bold">Total Devengado</Typography>
                                <Typography variant="subtitle1" fontWeight="bold" color="success.main">{formatCurrency(devengos.total)}</Typography>
                            </Box>
                        </Stack>
                    </Grid>

                    {/* Deducciones */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="error.main" fontWeight="bold" gutterBottom sx={{ borderBottom: 1, borderColor: 'divider', pb: 1 }}>
                            DEDUCCIONES
                        </Typography>
                        <Stack spacing={1.5} sx={{ mt: 2 }}>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Salud (4%)</Typography>
                                <Typography variant="body2" fontWeight="medium">{formatCurrency(deducciones.salud)}</Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Pensión (4%)</Typography>
                                <Typography variant="body2" fontWeight="medium">{formatCurrency(deducciones.pension)}</Typography>
                            </Box>
                            {deducciones.otras > 0 && (
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="text.secondary">Otras</Typography>
                                    <Typography variant="body2" fontWeight="medium">{formatCurrency(deducciones.otras)}</Typography>
                                </Box>
                            )}
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between">
                                <Typography variant="subtitle1" fontWeight="bold">Total Deducido</Typography>
                                <Typography variant="subtitle1" fontWeight="bold" color="error.main">{formatCurrency(deducciones.total)}</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>

            {/* Net Pay Footer */}
            <Box sx={{ bgcolor: 'action.hover', p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    {receipt.totalEmployerCosts && (
                        <Typography variant="caption" color="text.secondary">
                            Costo Empresa: {formatCurrency(receipt.totalEmployerCosts)}
                        </Typography>
                    )}
                </Box>
                <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Neto a Pagar
                    </Typography>
                    <Typography variant="h5" fontWeight="black" color="primary.main">
                        {formatCurrency(receipt.netPay)}
                    </Typography>
                </Box>
            </Box>
        </Card>
    )
}
