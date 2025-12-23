'use client'

import { useState, useRef } from 'react'
import {
    Card,
    CardContent,
    Grid,
    TextField,
    Button,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material'
import {
    Download,
    PictureAsPdf,
    Search,
    TrendingUp,
    TrendingDown
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { AccountingReportService } from '@/services/accounting/reportService'
import { userMethods } from '@/utils/userMethods'
import type { LibroDiarioDTO, VoucherType } from '@/types/apps/contabilidadTypes'

const voucherTypeOptions: { value: VoucherType | ''; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'INGRESO', label: 'Ingreso' },
    { value: 'EGRESO', label: 'Egreso' },
    { value: 'NOTA_CONTABLE', label: 'Nota Contable' }
]

const LibroDiarioView = () => {
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [voucherType, setVoucherType] = useState<VoucherType | ''>('')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<LibroDiarioDTO | null>(null)
    const reportRef = useRef<HTMLDivElement>(null)

    const handleSearch = async () => {
        if (!fromDate || !toDate) {
            toast.error('Seleccione las fechas')
            return
        }

        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

            const result = await AccountingReportService.getLibroDiario(
                tenantId,
                fromDate,
                toDate,
                voucherType || undefined
            )
            setData(result)
            toast.success('Reporte generado exitosamente')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al generar reporte')
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data) return

        const excelData = data.entries.map(entry => ({
            Fecha: format(new Date(entry.date), 'dd/MM/yyyy'),
            Comprobante: `${entry.voucherType}-${entry.voucherNumber}`,
            Cuenta: entry.accountCode,
            'Nombre Cuenta': entry.accountName,
            Tercero: entry.thirdPartyName || '',
            Descripción: entry.description,
            Débito: entry.debitAmount,
            Crédito: entry.creditAmount
        }))

        AccountingReportService.exportToExcel(excelData, `LibroDiario_${fromDate}_${toDate}`)
        toast.success('Exportado a Excel')
    }

    const handleExportPDF = () => {
        if (!reportRef.current) return
        AccountingReportService.exportToPDF(reportRef.current, `LibroDiario_${fromDate}_${toDate}`)
        toast.success('Exportando a PDF...')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    const isBalanced = data ? Math.abs(data.totalDebit - data.totalCredit) < 0.01 : true

    return (
        <Grid container spacing={6}>
            {/* Filtros */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant='h5' sx={{ mb: 4 }}>
                            📖 Libro Diario
                        </Typography>

                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label='Fecha Inicial'
                                    type='date'
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    label='Fecha Final'
                                    type='date'
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={3}>
                                <TextField
                                    fullWidth
                                    select
                                    label='Tipo Comprobante'
                                    value={voucherType}
                                    onChange={(e) => setVoucherType(e.target.value as VoucherType | '')}
                                >
                                    {voucherTypeOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            <Grid item xs={12} sm={3}>
                                <Button
                                    fullWidth
                                    variant='contained'
                                    startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                                    onClick={handleSearch}
                                    disabled={loading}
                                    sx={{ height: '56px' }}
                                >
                                    Generar Reporte
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Resumen */}
            {data && (
                <Grid item xs={12}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <CardContent>
                                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                                        <Box>
                                            <Typography variant='h6'>Total Débitos</Typography>
                                            <Typography variant='h4'>{formatCurrency(data.totalDebit)}</Typography>
                                        </Box>
                                        <TrendingUp fontSize='large' />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                                <CardContent>
                                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                                        <Box>
                                            <Typography variant='h6'>Total Créditos</Typography>
                                            <Typography variant='h4'>{formatCurrency(data.totalCredit)}</Typography>
                                        </Box>
                                        <TrendingDown fontSize='large' />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <Card sx={{ bgcolor: isBalanced ? 'info.main' : 'error.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>Total Movimientos</Typography>
                                    <Typography variant='h4'>{data.totalEntries}</Typography>
                                    <Chip
                                        label={isBalanced ? 'BALANCEADO' : 'DESBALANCEADO'}
                                        color={isBalanced ? 'success' : 'error'}
                                        size='small'
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            )}

            {/* Acciones */}
            {data && (
                <Grid item xs={12}>
                    <Box display='flex' gap={2} justifyContent='flex-end'>
                        <Button
                            variant='outlined'
                            startIcon={<Download />}
                            onClick={handleExportExcel}
                        >
                            Exportar Excel
                        </Button>
                        <Button
                            variant='outlined'
                            startIcon={<PictureAsPdf />}
                            onClick={handleExportPDF}
                            color='error'
                        >
                            Exportar PDF
                        </Button>
                    </Box>
                </Grid>
            )}

            {/* Tabla */}
            {data && (
                <Grid item xs={12}>
                    <Card>
                        <CardContent ref={reportRef}>
                            <Typography variant='h6' sx={{ mb: 3 }}>
                                Libro Diario - {format(new Date(data.fromDate), 'dd/MMM/yyyy', { locale: es })} al {format(new Date(data.toDate), 'dd/MMM/yyyy', { locale: es })}
                            </Typography>

                            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Fecha</strong></TableCell>
                                            <TableCell><strong>Comprobante</strong></TableCell>
                                            <TableCell><strong>Cuenta</strong></TableCell>
                                            <TableCell><strong>Tercero</strong></TableCell>
                                            <TableCell><strong>Descripción</strong></TableCell>
                                            <TableCell align='right'><strong>Débito</strong></TableCell>
                                            <TableCell align='right'><strong>Crédito</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.entries.map((entry, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>
                                                    <Chip label={`${entry.voucherType}-${entry.voucherNumber}`} size='small' />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant='body2' fontWeight='bold'>{entry.accountCode}</Typography>
                                                    <Typography variant='caption' color='text.secondary'>{entry.accountName}</Typography>
                                                </TableCell>
                                                <TableCell>{entry.thirdPartyName || '-'}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell align='right' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                    {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                                                </TableCell>
                                                <TableCell align='right' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                    {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell colSpan={5} align='right'><strong>TOTALES:</strong></TableCell>
                                            <TableCell align='right' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalDebit)}
                                            </TableCell>
                                            <TableCell align='right' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalCredit)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {!isBalanced && (
                                <Alert severity='error' sx={{ mt: 2 }}>
                                    ⚠️ El libro diario no está balanceado. Diferencia: {formatCurrency(Math.abs(data.totalDebit - data.totalCredit))}
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {!data && !loading && (
                <Grid item xs={12}>
                    <Alert severity='info'>
                        Seleccione un rango de fechas y presione "Generar Reporte" para ver el Libro Diario
                    </Alert>
                </Grid>
            )}
        </Grid>
    )
}

export default LibroDiarioView
