'use client'

import { useState, useRef } from 'react'
import {
    Card, CardContent, Grid, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, CircularProgress, Alert, Divider
} from '@mui/material'
import { Download, Search, TrendingUp, TrendingDown, Assessment } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'
import { AccountingReportService } from '@/services/accounting/reportService'
import { userMethods } from '@/utils/userMethods'
import type { EstadoResultadosDTO } from '@/types/apps/contabilidadTypes'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const EstadoResultadosView = () => {
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<EstadoResultadosDTO | null>(null)
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
            const result = await AccountingReportService.getEstadoResultados(tenantId, fromDate, toDate)
            setData(result)
            toast.success('Estado de Resultados generado')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al generar reporte')
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data) return
        const excelData = [
            { Concepto: 'Ingresos Operacionales', Valor: data.ingresosOperacionales },
            { Concepto: 'Ingresos No Operacionales', Valor: data.ingresosNoOperacionales },
            { Concepto: 'TOTAL INGRESOS', Valor: data.totalIngresos },
            { Concepto: 'Costo de Ventas', Valor: data.costoVentas },
            { Concepto: 'UTILIDAD BRUTA', Valor: data.utilidadBruta },
            { Concepto: 'Gastos Operacionales', Valor: data.gastosOperacionales },
            { Concepto: 'Gastos No Operacionales', Valor: data.gastosNoOperacionales },
            { Concepto: 'TOTAL GASTOS', Valor: data.totalGastos },
            { Concepto: 'UTILIDAD NETA', Valor: data.utilidadNeta }
        ]
        AccountingReportService.exportToExcel(excelData, `EstadoResultados_${fromDate}_${toDate}`)
        toast.success('Exportado a Excel')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    // Gráficos
    const barChartData = data ? [
        { name: 'Ingresos', value: data.totalIngresos },
        { name: 'Gastos', value: data.totalGastos },
        { name: 'Utilidad Neta', value: data.utilidadNeta }
    ] : []

    const pieChartData = data ? [
        { name: 'Ing. Operacionales', value: data.ingresosOperacionales },
        { name: 'Ing. No Operacionales', value: data.ingresosNoOperacionales },
        { name: 'Costo Ventas', value: data.costoVentas },
        { name: 'Gastos', value: data.totalGastos }
    ] : []

    const hasProfit = data && data.utilidadNeta > 0
    const marginPercentage = data && data.totalIngresos > 0
        ? ((data.utilidadNeta / data.totalIngresos) * 100).toFixed(2)
        : '0'

    return (
        <Grid container spacing={6}>
            {/* Filtros */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant='h5' sx={{ mb: 4 }}>
                            💰 Estado de Resultados (P&L)
                        </Typography>

                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label='Fecha Inicial'
                                    type='date'
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label='Fecha Final'
                                    type='date'
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={4}>
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

            {/* Resumen KPIs */}
            {data && (
                <Grid item xs={12}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                                <CardContent>
                                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                                        <Box>
                                            <Typography variant='h6'>Ingresos Totales</Typography>
                                            <Typography variant='h4'>{formatCurrency(data.totalIngresos)}</Typography>
                                        </Box>
                                        <TrendingUp fontSize='large' />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
                                <CardContent>
                                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                                        <Box>
                                            <Typography variant='h6'>Gastos Totales</Typography>
                                            <Typography variant='h4'>{formatCurrency(data.totalGastos)}</Typography>
                                        </Box>
                                        <TrendingDown fontSize='large' />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: hasProfit ? 'info.main' : 'warning.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>
                                        {hasProfit ? 'Utilidad Neta' : 'Pérdida Neta'}
                                    </Typography>
                                    <Typography variant='h4'>{formatCurrency(Math.abs(data.utilidadNeta))}</Typography>
                                    <Chip
                                        label={hasProfit ? 'GANANCIA' : 'PÉRDIDA'}
                                        color={hasProfit ? 'success' : 'error'}
                                        size='small'
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>Margen Neto</Typography>
                                    <Typography variant='h4'>{marginPercentage}%</Typography>
                                    <Typography variant='caption'>
                                        Utilidad / Ingresos
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            )}

            {/* Gráficos */}
            {data && (
                <Grid item xs={12}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={8}>
                            <Card>
                                <CardContent>
                                    <Typography variant='h6' sx={{ mb: 3 }}>
                                        📊 Comparativo Ingresos - Gastos - Utilidad
                                    </Typography>
                                    <ResponsiveContainer width='100%' height={300}>
                                        <BarChart data={barChartData}>
                                            <CartesianGrid strokeDasharray='3 3' />
                                            <XAxis dataKey='name' />
                                            <YAxis tickFormatter={(value) => formatCurrency(value)} />
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                            <Legend />
                                            <Bar dataKey='value' fill='#8884d8' name='Valor' />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Typography variant='h6' sx={{ mb: 3 }}>
                                        🥧 Distribución
                                    </Typography>
                                    <ResponsiveContainer width='100%' height={300}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                dataKey='value'
                                                nameKey='name'
                                                cx='50%'
                                                cy='50%'
                                                outerRadius={80}
                                                label
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        </PieChart>
                                    </ResponsiveContainer>
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
                        <Button variant='outlined' startIcon={<Download />} onClick={handleExportExcel}>
                            Exportar Excel
                        </Button>
                    </Box>
                </Grid>
            )}

            {/* Tabla P&L */}
            {data && (
                <Grid item xs={12}>
                    <Card>
                        <CardContent ref={reportRef}>
                            <Typography variant='h6' sx={{ mb: 3 }}>
                                Estado de Resultados
                            </Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                                Período: {format(new Date(data.fromDate), 'dd/MMM/yyyy', { locale: es })} al{' '}
                                {format(new Date(data.toDate), 'dd/MMM/yyyy', { locale: es })}
                            </Typography>

                            <TableContainer component={Paper}>
                                <Table>
                                    <TableBody>
                                        {/* INGRESOS */}
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ bgcolor: 'success.light' }}>
                                                <Typography variant='h6' color='white'>INGRESOS</Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Ingresos Operacionales</TableCell>
                                            <TableCell align='right'>{formatCurrency(data.ingresosOperacionales)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Ingresos No Operacionales</TableCell>
                                            <TableCell align='right'>{formatCurrency(data.ingresosNoOperacionales)}</TableCell>
                                        </TableRow>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell><strong>TOTAL INGRESOS</strong></TableCell>
                                            <TableCell align='right'><strong>{formatCurrency(data.totalIngresos)}</strong></TableCell>
                                        </TableRow>

                                        {/* COSTOS */}
                                        <TableRow>
                                            <TableCell colSpan={2}>
                                                <Divider sx={{ my: 1 }} />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Costo de Ventas</TableCell>
                                            <TableCell align='right' sx={{ color: 'error.main' }}>
                                                ({formatCurrency(data.costoVentas)})
                                            </TableCell>
                                        </TableRow>
                                        <TableRow sx={{ bgcolor: 'info.light' }}>
                                            <TableCell><strong>UTILIDAD BRUTA</strong></TableCell>
                                            <TableCell align='right'><strong>{formatCurrency(data.utilidadBruta)}</strong></TableCell>
                                        </TableRow>

                                        {/* GASTOS */}
                                        <TableRow>
                                            <TableCell colSpan={2}>
                                                <Divider sx={{ my: 1 }} />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell colSpan={2} sx={{ bgcolor: 'error.light' }}>
                                                <Typography variant='h6' color='white'>GASTOS</Typography>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Gastos Operacionales</TableCell>
                                            <TableCell align='right' sx={{ color: 'error.main' }}>
                                                ({formatCurrency(data.gastosOperacionales)})
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Gastos No Operacionales</TableCell>
                                            <TableCell align='right' sx={{ color: 'error.main' }}>
                                                ({formatCurrency(data.gastosNoOperacionales)})
                                            </TableCell>
                                        </TableRow>
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell><strong>TOTAL GASTOS</strong></TableCell>
                                            <TableCell align='right' sx={{ color: 'error.main' }}>
                                                <strong>({formatCurrency(data.totalGastos)})</strong>
                                            </TableCell>
                                        </TableRow>

                                        {/* UTILIDAD NETA */}
                                        <TableRow>
                                            <TableCell colSpan={2}>
                                                <Divider sx={{ my: 1 }} />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow
                                            sx={{
                                                bgcolor: hasProfit ? 'success.main' : 'error.main',
                                                color: 'white'
                                            }}
                                        >
                                            <TableCell sx={{ color: 'white' }}>
                                                <Typography variant='h6'>
                                                    {hasProfit ? 'UTILIDAD NETA' : 'PÉRDIDA NETA'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align='right' sx={{ color: 'white' }}>
                                                <Typography variant='h6'>
                                                    {formatCurrency(data.utilidadNeta)}
                                                </Typography>
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
                        Seleccione un rango de fechas para ver el Estado de Resultados
                    </Alert>
                </Grid>
            )}
        </Grid>
    )
}

export default EstadoResultadosView
