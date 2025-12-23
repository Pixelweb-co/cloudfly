'use client'

import { useState, useRef, useEffect } from 'react'
import {
    Card, CardContent, Grid, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, CircularProgress, Alert, Autocomplete
} from '@mui/material'
import { Download, PictureAsPdf, Search, TrendingUp, AccountBalanceWallet } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AccountingReportService } from '@/services/accounting/reportService'
import { userMethods } from '@/utils/userMethods'
import type { LibroMayorDTO } from '@/types/apps/contabilidadTypes'

// Cuentas más comunes (en producción vienen del backend)
const COMMON_ACCOUNTS = [
    { code: '1105', name: 'Caja' },
    { code: '1110', name: 'Bancos' },
    { code: '1305', name: 'Clientes' },
    { code: '1435', name: 'Mercancías' },
    { code: '2205', name: 'Proveedores' },
    { code: '2408', name: 'IVA por Pagar' },
    { code: '3105', name: 'Capital' },
    { code: '4135', name: 'Ventas' },
    { code: '5105', name: 'Gastos Personal' },
    { code: '6135', name: 'Costo de Ventas' }
]

const LibroMayorView = () => {
    const [accountCode, setAccountCode] = useState<string>('')
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<LibroMayorDTO | null>(null)
    const reportRef = useRef<HTMLDivElement>(null)

    const handleSearch = async () => {
        if (!accountCode || !fromDate || !toDate) {
            toast.error('Complete todos los campos')
            return
        }

        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

            const result = await AccountingReportService.getLibroMayor(tenantId, accountCode, fromDate, toDate)
            setData(result)
            toast.success('Libro Mayor generado')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al generar libro mayor')
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data) return
        const excelData = data.entries.map(entry => ({
            Fecha: format(new Date(entry.date), 'dd/MM/yyyy'),
            Comprobante: `${entry.voucherType}-${entry.voucherNumber}`,
            Descripción: entry.description,
            Tercero: entry.thirdPartyName || '',
            Débito: entry.debitAmount,
            Crédito: entry.creditAmount,
            Saldo: entry.balance
        }))
        AccountingReportService.exportToExcel(excelData, `LibroMayor_${accountCode}_${fromDate}_${toDate}`)
        toast.success('Exportado a Excel')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    // Datos para gráfico de evolución
    const chartData = data?.entries.map((entry, index) => ({
        index: index + 1,
        fecha: format(new Date(entry.date), 'dd/MM'),
        saldo: entry.balance
    })) || []

    const movementNet = data ? data.totalDebit - data.totalCredit : 0
    const isDebitNature = data?.nature === 'DEBITO'

    return (
        <Grid container spacing={6}>
            {/* Filtros */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant='h5' sx={{ mb: 4 }}>
                            📊 Libro Mayor
                        </Typography>

                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    options={COMMON_ACCOUNTS}
                                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                                    onChange={(_, value) => setAccountCode(value?.code || '')}
                                    renderInput={(params) => (
                                        <TextField {...params} label='Seleccione Cuenta' placeholder='Buscar...' />
                                    )}
                                />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                                <TextField
                                    fullWidth
                                    label='Fecha Inicial'
                                    type='date'
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                                <TextField
                                    fullWidth
                                    label='Fecha Final'
                                    type='date'
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={2}>
                                <Button
                                    fullWidth
                                    variant='contained'
                                    startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                                    onClick={handleSearch}
                                    disabled={loading}
                                    sx={{ height: '56px' }}
                                >
                                    Consultar
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
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>Saldo Inicial</Typography>
                                    <Typography variant='h4'>{formatCurrency(data.initialBalance)}</Typography>
                                    <Chip
                                        label={data.nature}
                                        size='small'
                                        sx={{ mt: 1, bgcolor: 'white', color: 'info.main' }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>Débitos</Typography>
                                    <Typography variant='h4'>{formatCurrency(data.totalDebit)}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>Créditos</Typography>
                                    <Typography variant='h4'>{formatCurrency(data.totalCredit)}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>Saldo Final</Typography>
                                    <Typography variant='h4'>{formatCurrency(data.finalBalance)}</Typography>
                                    <Typography variant='caption'>{data.totalEntries} movimientos</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            )}

            {/* Gráfico de Evolución */}
            {data && chartData.length > 0 && (
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant='h6' sx={{ mb: 3 }}>
                                📈 Evolución del Saldo
                            </Typography>
                            <ResponsiveContainer width='100%' height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray='3 3' />
                                    <XAxis dataKey='fecha' />
                                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Line
                                        type='monotone'
                                        dataKey='saldo'
                                        stroke='#8884d8'
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                        name='Saldo'
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {/* Acciones */}
            {data && (
                <Grid item xs={12}>
                    <Box display='flex' gap={2} justifyContent='flex-end'>
                        <Button variant='outlined' startIcon={<Download />} onClick={handleExportExcel}>
                            Exportar Excel
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
                                Libro Mayor - Cuenta {data.accountCode} - {data.accountName}
                            </Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                                Período: {format(new Date(data.fromDate), 'dd/MMM/yyyy', { locale: es })} al{' '}
                                {format(new Date(data.toDate), 'dd/MMM/yyyy', { locale: es })}
                            </Typography>

                            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Fecha</strong></TableCell>
                                            <TableCell><strong>Comprobante</strong></TableCell>
                                            <TableCell><strong>Tercero</strong></TableCell>
                                            <TableCell><strong>Descripción</strong></TableCell>
                                            <TableCell align='right'><strong>Débito</strong></TableCell>
                                            <TableCell align='right'><strong>Crédito</strong></TableCell>
                                            <TableCell align='right'><strong>Saldo</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {/* Saldo Inicial */}
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell colSpan={6}><strong>SALDO INICIAL</strong></TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                                {formatCurrency(data.initialBalance)}
                                            </TableCell>
                                        </TableRow>

                                        {/* Movimientos */}
                                        {data.entries.map((entry, index) => (
                                            <TableRow key={index} hover>
                                                <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                                                <TableCell>
                                                    <Chip label={`${entry.voucherType}-${entry.voucherNumber}`} size='small' />
                                                </TableCell>
                                                <TableCell>{entry.thirdPartyName || '-'}</TableCell>
                                                <TableCell>{entry.description}</TableCell>
                                                <TableCell align='right' sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                                    {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                                                </TableCell>
                                                <TableCell align='right' sx={{ color: 'success.main', fontWeight: 'medium' }}>
                                                    {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                                                </TableCell>
                                                <TableCell
                                                    align='right'
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: entry.balance >= 0 ? 'info.main' : 'error.main'
                                                    }}
                                                >
                                                    {formatCurrency(entry.balance)}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Totales */}
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell colSpan={4} align='right'><strong>TOTALES:</strong></TableCell>
                                            <TableCell align='right' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalDebit)}
                                            </TableCell>
                                            <TableCell align='right' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalCredit)}
                                            </TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                                {formatCurrency(data.finalBalance)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {!data && !loading && (
                <Grid item xs={12}>
                    <Alert severity='info'>
                        Seleccione una cuenta y rango de fechas para ver el Libro Mayor
                    </Alert>
                </Grid>
            )}
        </Grid>
    )
}

export default LibroMayorView
