'use client'

import { useState, useEffect } from 'react'
import {
    Card, CardContent, Grid, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import {
    Add, Edit, Delete, Visibility, Check, Close, PostAdd, Block
} from '@mui/icons-material'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { VoucherService, type VoucherResponse } from '@/services/accounting/voucherService'
import { userMethods } from '@/utils/userMethods'
import VoucherFormDialog from './form/VoucherFormDialog'

const ComprobantesView = () => {
    const [vouchers, setVouchers] = useState<VoucherResponse[]>([])
    const [loading, setLoading] = useState(false)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [formDialogOpen, setFormDialogOpen] = useState(false)
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherResponse | null>(null)

    useEffect(() => {
        loadVouchers()
    }, [])

    const loadVouchers = async () => {
        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)
            const data = await VoucherService.getAll(tenantId)
            setVouchers(data)
            toast.success('Comprobantes cargados')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al cargar comprobantes')
        } finally {
            setLoading(false)
        }
    }

    const handleView = async (id: number) => {
        try {
            const voucher = await VoucherService.getById(id)
            setSelectedVoucher(voucher)
            setDetailDialogOpen(true)
        } catch (error: any) {
            toast.error('Error al cargar detalle')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar este comprobante?')) return

        try {
            await VoucherService.delete(id)
            toast.success('Comprobante eliminado')
            loadVouchers()
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al eliminar')
        }
    }

    const handlePost = async (id: number) => {
        if (!confirm('¿Contabilizar este comprobante? No podrá editarse después.')) return

        try {
            await VoucherService.post(id)
            toast.success('Comprobante contabilizado')
            loadVouchers()
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al contabilizar')
        }
    }

    const handleVoid = async (id: number) => {
        if (!confirm('¿Anular este comprobante?')) return

        try {
            await VoucherService.void(id)
            toast.success('Comprobante anulado')
            loadVouchers()
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al anular')
        }
    }

    const getStatusChip = (status: string) => {
        const colors: any = {
            DRAFT: 'warning',
            POSTED: 'success',
            VOID: 'error'
        }
        const labels: any = {
            DRAFT: 'Borrador',
            POSTED: 'Contabilizado',
            VOID: 'Anulado'
        }
        return <Chip label={labels[status] || status} color={colors[status] || 'default'} size='small' />
    }

    const getTypeChip = (type: string) => {
        const colors: any = {
            INGRESO: 'success',
            EGRESO: 'error',
            NOTA_CONTABLE: 'info'
        }
        return <Chip label={type.replace('_', ' ')} color={colors[type] || 'default'} size='small' />
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    const stats = {
        total: vouchers.length,
        draft: vouchers.filter(v => v.status === 'DRAFT').length,
        posted: vouchers.filter(v => v.status === 'POSTED').length,
        void: vouchers.filter(v => v.status === 'VOID').length
    }

    return (
        <Grid container spacing={6}>
            {/* Header */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Box display='flex' justifyContent='space-between' alignItems='center'>
                            <Typography variant='h5'>
                                📝 Comprobantes Contables
                            </Typography>
                            <Button
                                variant='contained'
                                startIcon={<Add />}
                                onClick={() => setFormDialogOpen(true)}
                            >
                                Nuevo Comprobante
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* KPIs */}
            <Grid item xs={12}>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={3}>
                        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant='h6'>Total</Typography>
                                <Typography variant='h3'>{stats.total}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant='h6'>Borradores</Typography>
                                <Typography variant='h3'>{stats.draft}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant='h6'>Contabilizados</Typography>
                                <Typography variant='h3'>{stats.posted}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant='h6'>Anulados</Typography>
                                <Typography variant='h3'>{stats.void}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>

            {/* Tabla */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        {loading ? (
                            <Box display='flex' justifyContent='center' py={4}>
                                <CircularProgress />
                            </Box>
                        ) : vouchers.length === 0 ? (
                            <Alert severity='info'>
                                No hay comprobantes registrados. Haz clic en "Nuevo Comprobante" para crear uno.
                            </Alert>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Número</strong></TableCell>
                                            <TableCell><strong>Fecha</strong></TableCell>
                                            <TableCell><strong>Tipo</strong></TableCell>
                                            <TableCell><strong>Descripción</strong></TableCell>
                                            <TableCell align='right'><strong>Débitos</strong></TableCell>
                                            <TableCell align='right'><strong>Créditos</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                            <TableCell align='right'><strong>Acciones</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {vouchers.map((voucher) => (
                                            <TableRow key={voucher.id} hover>
                                                <TableCell>
                                                    <Typography variant='body2' fontFamily='monospace' fontWeight='bold'>
                                                        {voucher.voucherNumber}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {format(new Date(voucher.date), 'dd/MMM/yyyy', { locale: es })}
                                                </TableCell>
                                                <TableCell>{getTypeChip(voucher.voucherType)}</TableCell>
                                                <TableCell>
                                                    <Typography variant='body2'>
                                                        {voucher.description}
                                                    </Typography>
                                                    {voucher.reference && (
                                                        <Typography variant='caption' color='text.secondary'>
                                                            Ref: {voucher.reference}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align='right' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                    {formatCurrency(voucher.totalDebit)}
                                                </TableCell>
                                                <TableCell align='right' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                    {formatCurrency(voucher.totalCredit)}
                                                </TableCell>
                                                <TableCell>{getStatusChip(voucher.status)}</TableCell>
                                                <TableCell align='right'>
                                                    <IconButton
                                                        size='small'
                                                        color='info'
                                                        onClick={() => handleView(voucher.id)}
                                                    >
                                                        <Visibility fontSize='small' />
                                                    </IconButton>

                                                    {voucher.status === 'DRAFT' && (
                                                        <>
                                                            <IconButton
                                                                size='small'
                                                                color='success'
                                                                onClick={() => handlePost(voucher.id)}
                                                                title='Contabilizar'
                                                            >
                                                                <PostAdd fontSize='small' />
                                                            </IconButton>
                                                            <IconButton
                                                                size='small'
                                                                color='error'
                                                                onClick={() => handleDelete(voucher.id)}
                                                            >
                                                                <Delete fontSize='small' />
                                                            </IconButton>
                                                        </>
                                                    )}

                                                    {voucher.status === 'POSTED' && (
                                                        <IconButton
                                                            size='small'
                                                            color='error'
                                                            onClick={() => handleVoid(voucher.id)}
                                                            title='Anular'
                                                        >
                                                            <Block fontSize='small' />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* Dialog Detalle */}
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth='lg' fullWidth>
                <DialogTitle>
                    Detalle del Comprobante {selectedVoucher?.voucherNumber}
                </DialogTitle>
                <DialogContent>
                    {selectedVoucher && (
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Typography variant='body2'><strong>Tipo:</strong> {selectedVoucher.voucherType}</Typography>
                                <Typography variant='body2'><strong>Fecha:</strong> {format(new Date(selectedVoucher.date), 'dd/MM/yyyy')}</Typography>
                                <Typography variant='body2'><strong>Descripción:</strong> {selectedVoucher.description}</Typography>
                                {selectedVoucher.reference && (
                                    <Typography variant='body2'><strong>Referencia:</strong> {selectedVoucher.reference}</Typography>
                                )}
                                <Typography variant='body2'><strong>Estado:</strong> {getStatusChip(selectedVoucher.status)}</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant='h6' sx={{ mb: 2 }}>Detalle de Asiento</Typography>
                                <TableContainer component={Paper}>
                                    <Table size='small'>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Cuenta</strong></TableCell>
                                                <TableCell><strong>Tercero</strong></TableCell>
                                                <TableCell><strong>C. Costo</strong></TableCell>
                                                <TableCell><strong>Descripción</strong></TableCell>
                                                <TableCell align='right'><strong>Débito</strong></TableCell>
                                                <TableCell align='right'><strong>Crédito</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedVoucher.entries.map((entry, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Typography variant='body2' fontFamily='monospace'>
                                                            {entry.accountCode}
                                                        </Typography>
                                                        <Typography variant='caption' color='text.secondary'>
                                                            {entry.accountName}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant='caption'>
                                                            {entry.thirdPartyName || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant='caption'>
                                                            {entry.costCenterName || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{entry.description}</TableCell>
                                                    <TableCell align='right' sx={{ color: 'primary.main' }}>
                                                        {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                                                    </TableCell>
                                                    <TableCell align='right' sx={{ color: 'success.main' }}>
                                                        {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                <TableCell colSpan={4} align='right'><strong>TOTALES:</strong></TableCell>
                                                <TableCell align='right' sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                    {formatCurrency(selectedVoucher.totalDebit)}
                                                </TableCell>
                                                <TableCell align='right' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                                    {formatCurrency(selectedVoucher.totalCredit)}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailDialogOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Formulario de Creación */}
            <VoucherFormDialog
                open={formDialogOpen}
                onClose={() => setFormDialogOpen(false)}
                onSuccess={loadVouchers}
            />
        </Grid>
    )
}

export default ComprobantesView
