'use client'

import { useState, useRef } from 'react'
import {
    Card, CardContent, Grid, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, CircularProgress, Alert
} from '@mui/material'
import { Download, Search, Check, Close } from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { AccountingReportService } from '@/services/accounting/reportService'
import { userMethods } from '@/utils/userMethods'

const BalancePruebaView = () => {
    const [asOfDate, setAsOfDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState<any | null>(null)
    const reportRef = useRef<HTMLDivElement>(null)

    const handleSearch = async () => {
        if (!asOfDate) {
            toast.error('Seleccione una fecha de corte')
            return
        }

        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

            const result = await AccountingReportService.getBalancePrueba(tenantId, asOfDate)
            setData(result)
            toast.success('Balance de Prueba generado exitosamente')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al generar balance')
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data) return
        const excelData = data.accounts.map((row: any) => ({
            Código: row.accountCode,
            Cuenta: row.accountName,
            Tipo: row.accountType,
            'Débito Movimiento': row.debitMovement,
            'Crédito Movimiento': row.creditMovement,
            'Saldo Débito': row.debitBalance,
            'Saldo Crédito': row.creditBalance
        }))
        AccountingReportService.exportToExcel(excelData, `BalancePrueba_${asOfDate}`)
        toast.success('Exportado a Excel')
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    return (
        <Grid container spacing={6}>
            {/* Filtros */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant='h5' sx={{ mb: 4 }}>
                            📊 Balance de Prueba
                        </Typography>

                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label='Fecha de Corte'
                                    type='date'
                                    value={asOfDate}
                                    onChange={(e) => setAsOfDate(e.target.value)}
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
                                    Generar
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* KPIs */}
            {data && (
                <Grid item xs={12}>
                    <Grid container spacing={4}>
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
                            <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                                <CardContent>
                                    <Typography variant='h6'>Total Cuentas</Typography>
                                    <Typography variant='h4'>{data.totalAccounts}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <Card sx={{ bgcolor: data.isBalanced ? 'success.main' : 'error.main', color: 'white' }}>
                                <CardContent>
                                    <Box display='flex' alignItems='center' gap={1}>
                                        {data.isBalanced ? <Check /> : <Close />}
                                        <Typography variant='h6'>
                                            {data.isBalanced ? 'Balanceado' : 'Desbalanceado'}
                                        </Typography>
                                    </Box>
                                    <Typography variant='h4'>
                                        {formatCurrency(Math.abs(data.totalDebitBalance - data.totalCreditBalance))}
                                    </Typography>
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

            {/* Tabla */}
            {data && (
                <Grid item xs={12}>
                    <Card>
                        <CardContent ref={reportRef}>
                            <Typography variant='h6' sx={{ mb: 3 }}>
                                Balance de Prueba al {format(new Date(data.asOfDate), 'dd/MMM/yyyy', { locale: es })}
                            </Typography>

                            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Código</strong></TableCell>
                                            <TableCell><strong>Cuenta</strong></TableCell>
                                            <TableCell><strong>Tipo</strong></TableCell>
                                            <TableCell align='right'><strong>Débito Mov.</strong></TableCell>
                                            <TableCell align='right'><strong>Crédito Mov.</strong></TableCell>
                                            <TableCell align='right'><strong>Saldo Débito</strong></TableCell>
                                            <TableCell align='right'><strong>Saldo Crédito</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.accounts.map((row: any, index: number) => (
                                            <TableRow key={index} hover>
                                                <TableCell>
                                                    <Typography variant='body2' fontFamily='monospace' fontWeight='bold'>
                                                        {row.accountCode}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant='body2'>{row.accountName}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={row.accountType} size='small' color='primary' />
                                                </TableCell>
                                                <TableCell align='right' sx={{ color: 'primary.main' }}>
                                                    {row.debitMovement > 0 ? formatCurrency(row.debitMovement) : '-'}
                                                </TableCell>
                                                <TableCell align='right' sx={{ color: 'success.main' }}>
                                                    {row.creditMovement > 0 ? formatCurrency(row.creditMovement) : '-'}
                                                </TableCell>
                                                <TableCell align='right' sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                    {row.debitBalance > 0 ? formatCurrency(row.debitBalance) : '-'}
                                                </TableCell>
                                                <TableCell align='right' sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                    {row.creditBalance > 0 ? formatCurrency(row.creditBalance) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Totales */}
                                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                                            <TableCell colSpan={3} align='right'><strong>TOTALES:</strong></TableCell>
                                            <TableCell align='right' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalDebit)}
                                            </TableCell>
                                            <TableCell align='right' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalCredit)}
                                            </TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalDebitBalance)}
                                            </TableCell>
                                            <TableCell align='right' sx={{ fontWeight: 'bold' }}>
                                                {formatCurrency(data.totalCreditBalance)}
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
                        Seleccione una fecha de corte para ver el Balance de Prueba
                    </Alert>
                </Grid>
            )}
        </Grid>
    )
}

export default BalancePruebaView
