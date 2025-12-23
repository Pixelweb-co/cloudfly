'use client'

import { useState, useRef } from 'react'
import {
    Card, CardContent, Grid, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, CircularProgress, Alert, Divider
} from '@mui/material'
import { Download, PictureAsPdf, Search, AccountBalance } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { AccountingReportService } from '@/services/accounting/reportService'
import { userMethods } from '@/utils/userMethods'
import type { BalanceGeneralDTO } from '@/types/apps/contabilidadTypes'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const BalanceGeneralView = () => {
    const [asOfDate, setAsOfDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<BalanceGeneralDTO | null>(null)
    const reportRef = useRef<HTMLDivElement>(null)

    const handleSearch = async () => {
        if (!asOfDate) {
            toast.error('Seleccione la fecha de corte')
            return
        }

        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)
            const result = await AccountingReportService.getBalanceGeneral(tenantId, asOfDate)
            setData(result)
            toast.success('Balance generado exitosamente')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al generar balance')
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data) return
        const excelData = [
            ...data.activosCorrientes.accounts.map(a => ({ Tipo: 'Activo Corriente', ...a })),
            ...data.activosNoCorrientes.accounts.map(a => ({ Tipo: 'Activo No Corriente', ...a })),
            ...data.pasivosCorrientes.accounts.map(a => ({ Tipo: 'Pasivo Corriente', ...a })),
            ...data.pasivosNoCorrientes.accounts.map(a => ({ Tipo: 'Pasivo No Corriente', ...a })),
            ...data.patrimonio.accounts.map(a => ({ Tipo: 'Patrimonio', ...a }))
        ]
        AccountingReportService.exportToExcel(excelData, `BalanceGeneral_${asOfDate}`)
        toast.success('Exportado a Excel')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)
    }

    const chartData = data ? [
        { name: 'Activos', value: data.totalActivos },
        { name: 'Pasivos', value: data.totalPasivos },
        { name: 'Patrimonio', value: data.totalPatrimonio }
    ] : []

    return (
        <Grid container spacing={6}>
            {/* Filtros */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant='h5' sx={{ mb: 4 }}>💰 Balance General</Typography>
                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Fecha de Corte'
                                    type='date'
                                    value={asOfDate}
                                    onChange={(e) => setAsOfDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    fullWidth
                                    variant='contained'
                                    startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                                    onClick={handleSearch}
                                    disabled={loading}
                                    sx={{ height: '56px' }}
                                >
                                    Generar Balance
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Resumen */}
            {data && (
                <>
                    <Grid item xs={12} md={8}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                                    <CardContent>
                                        <Typography variant='h6'>Total Activos</Typography>
                                        <Typography variant='h4'>{formatCurrency(data.totalActivos)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
                                    <CardContent>
                                        <Typography variant='h6'>Total Pasivos</Typography>
                                        <Typography variant='h4'>{formatCurrency(data.totalPasivos)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                                    <CardContent>
                                        <Typography variant='h6'>Patrimonio</Typography>
                                        <Typography variant='h4'>{formatCurrency(data.totalPatrimonio)}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%' }}>
                            <CardContent>
                                <Typography variant='h6' sx={{ mb: 2 }}>Distribución</Typography>
                                <ResponsiveContainer width='100%' height={200}>
                                    <PieChart>
                                        <Pie data={chartData} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={60}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </>
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

            {/* Balance */}
            {data && (
                <Grid item xs={12}>
                    <Card>
                        <CardContent ref={reportRef}>
                            <Typography variant='h6' sx={{ mb: 3 }}>
                                Balance General al {format(new Date(data.asOfDate), 'dd/MMM/yyyy', { locale: es })}
                            </Typography>

                            <Grid container spacing={4}>
                                {/* ACTIVOS */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant='h6' color='primary'>ACTIVOS</Typography>
                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant='subtitle1' sx={{ mt: 2 }}>Activos Corrientes</Typography>
                                    <TableContainer>
                                        <Table size='small'>
                                            <TableBody>
                                                {data.activosCorrientes.accounts.map(acc => (
                                                    <TableRow key={acc.code}>
                                                        <TableCell>{acc.code}</TableCell>
                                                        <TableCell>{acc.name}</TableCell>
                                                        <TableCell align='right'>{formatCurrency(acc.balance)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell colSpan={2}><strong>Subtotal</strong></TableCell>
                                                    <TableCell align='right'><strong>{formatCurrency(data.activosCorrientes.total)}</strong></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Typography variant='subtitle1' sx={{ mt: 3 }}>Activos No Corrientes</Typography>
                                    <TableContainer>
                                        <Table size='small'>
                                            <TableBody>
                                                {data.activosNoCorrientes.accounts.map(acc => (
                                                    <TableRow key={acc.code}>
                                                        <TableCell>{acc.code}</TableCell>
                                                        <TableCell>{acc.name}</TableCell>
                                                        <TableCell align='right'>{formatCurrency(acc.balance)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell colSpan={2}><strong>Subtotal</strong></TableCell>
                                                    <TableCell align='right'><strong>{formatCurrency(data.activosNoCorrientes.total)}</strong></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light' }}>
                                        <Typography variant='h6' color='white'>
                                            TOTAL ACTIVOS: {formatCurrency(data.totalActivos)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {/* PASIVOS Y PATRIMONIO */}
                                <Grid item xs={12} md={6}>
                                    <Typography variant='h6' color='error'>PASIVOS</Typography>
                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant='subtitle1' sx={{ mt: 2 }}>Pasivos Corrientes</Typography>
                                    <TableContainer>
                                        <Table size='small'>
                                            <TableBody>
                                                {data.pasivosCorrientes.accounts.map(acc => (
                                                    <TableRow key={acc.code}>
                                                        <TableCell>{acc.code}</TableCell>
                                                        <TableCell>{acc.name}</TableCell>
                                                        <TableCell align='right'>{formatCurrency(acc.balance)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell colSpan={2}><strong>Subtotal</strong></TableCell>
                                                    <TableCell align='right'><strong>{formatCurrency(data.pasivosCorrientes.total)}</strong></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Typography variant='subtitle1' sx={{ mt: 3 }}>Pasivos No Corrientes</Typography>
                                    <TableContainer>
                                        <Table size='small'>
                                            <TableBody>
                                                {data.pasivosNoCorrientes.accounts.map(acc => (
                                                    <TableRow key={acc.code}>
                                                        <TableCell>{acc.code}</TableCell>
                                                        <TableCell>{acc.name}</TableCell>
                                                        <TableCell align='right'>{formatCurrency(acc.balance)}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                    <TableCell colSpan={2}><strong>Subtotal</strong></TableCell>
                                                    <TableCell align='right'><strong>{formatCurrency(data.pasivosNoCorrientes.total)}</strong></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light' }}>
                                        <Typography variant='h6' color='white'>
                                            TOTAL PASIVOS: {formatCurrency(data.totalPasivos)}
                                        </Typography>
                                    </Box>

                                    <Typography variant='h6' color='success.main' sx={{ mt: 3 }}>PATRIMONIO</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <TableContainer>
                                        <Table size='small'>
                                            <TableBody>
                                                {data.patrimonio.accounts.map(acc => (
                                                    <TableRow key={acc.code}>
                                                        <TableCell>{acc.code}</TableCell>
                                                        <TableCell>{acc.name}</TableCell>
                                                        <TableCell align='right'>{formatCurrency(acc.balance)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light' }}>
                                        <Typography variant='h6' color='white'>
                                            TOTAL PATRIMONIO: {formatCurrency(data.totalPatrimonio)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {data.isBalanced ? (
                                <Alert severity='success' sx={{ mt: 3 }}>✅ Balance verificado: Activo = Pasivo + Patrimonio</Alert>
                            ) : (
                                <Alert severity='error' sx={{ mt: 3 }}>⚠️ Balance desbalanceado</Alert>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            )}

            {!data && !loading && (
                <Grid item xs={12}>
                    <Alert severity='info'>
                        Seleccione una fecha de corte para ver el Balance General
                    </Alert>
                </Grid>
            )}
        </Grid>
    )
}

export default BalanceGeneralView
