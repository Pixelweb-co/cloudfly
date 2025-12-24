'use client'

import { useState, useEffect } from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Grid, TextField, Button, Typography, Box, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Autocomplete, Alert, Chip
} from '@mui/material'
import { Add, Delete, Save, Close, Check } from '@mui/icons-material'
import toast from 'react-hot-toast'
import { VoucherService, type VoucherRequest, type VoucherEntry } from '@/services/accounting/voucherService'
import { userMethods } from '@/utils/userMethods'
import { axiosInstance } from '@/utils/axiosInstance'

interface Account {
    code: string
    name: string
    accountType: string
}

interface Contact {
    id: number
    fullName: string
}

interface CostCenter {
    id: number
    code: string
    name: string
}

interface Props {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

const emptyEntry: VoucherEntry = {
    accountCode: '',
    accountName: '',
    thirdPartyId: null,
    costCenterId: null,
    description: '',
    debitAmount: 0,
    creditAmount: 0
}

const VoucherFormDialog = ({ open, onClose, onSuccess }: Props) => {
    const [voucherType, setVoucherType] = useState<'INGRESO' | 'EGRESO' | 'NOTA_CONTABLE'>('INGRESO')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState('')
    const [reference, setReference] = useState('')
    const [entries, setEntries] = useState<VoucherEntry[]>([{ ...emptyEntry }, { ...emptyEntry }])

    const [accounts, setAccounts] = useState<Account[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const [costCenters, setCostCenters] = useState<CostCenter[]>([])

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open])

    const loadData = async () => {
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

            // Cargar cuentas
            const accountsRes = await axiosInstance.get('/chart-of-accounts')
            setAccounts(accountsRes.data)

            // Cargar terceros
            const contactsRes = await axiosInstance.get('/contacts', { params: { tenantId } })
            setContacts(contactsRes.data)

            // Cargar centros de costo
            const centersRes = await axiosInstance.get('/cost-centers')
            setCostCenters(centersRes.data)
        } catch (error) {
            console.error('Error loading data', error)
        }
    }

    const handleAddLine = () => {
        setEntries([...entries, { ...emptyEntry }])
    }

    const handleRemoveLine = (index: number) => {
        if (entries.length <= 2) {
            toast.error('Debe haber al menos 2 líneas')
            return
        }
        setEntries(entries.filter((_, i) => i !== index))
    }

    const handleEntryChange = (index: number, field: keyof VoucherEntry, value: any) => {
        const newEntries = [...entries]
        newEntries[index] = { ...newEntries[index], [field]: value }
        setEntries(newEntries)
    }

    const handleAccountChange = (index: number, account: Account | null) => {
        if (account) {
            handleEntryChange(index, 'accountCode', account.code)
            handleEntryChange(index, 'accountName', account.name)
        }
    }

    const handleContactChange = (index: number, contact: Contact | null) => {
        handleEntryChange(index, 'thirdPartyId', contact ? contact.id : null)
        handleEntryChange(index, 'thirdPartyName', contact ? contact.fullName : '')
    }

    const handleCostCenterChange = (index: number, center: CostCenter | null) => {
        handleEntryChange(index, 'costCenterId', center ? center.id : null)
        handleEntryChange(index, 'costCenterName', center ? center.name : '')
    }

    const calculateTotals = () => {
        const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0)
        const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0)
        const difference = totalDebit - totalCredit
        const isBalanced = Math.abs(difference) < 0.01

        return { totalDebit, totalCredit, difference, isBalanced }
    }

    const handleSubmit = async (postImmediately: boolean = false) => {
        const { isBalanced } = calculateTotals()

        if (postImmediately && !isBalanced) {
            toast.error('El comprobante debe estar balanceado para contabilizar')
            return
        }

        if (!description.trim()) {
            toast.error('La descripción es requerida')
            return
        }

        const invalidEntries = entries.filter(e => !e.accountCode || !e.description)
        if (invalidEntries.length > 0) {
            toast.error('Todas las líneas deben tener cuenta y descripción')
            return
        }

        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            const tenantId = user.tenantId || (user.customer ? user.customer.id : 1)

            const request: VoucherRequest = {
                voucherType,
                date,
                description,
                reference: reference || undefined,
                tenantId,
                entries: entries.map((entry, index) => ({
                    ...entry,
                    lineNumber: index + 1,
                    debitAmount: entry.debitAmount || 0,
                    creditAmount: entry.creditAmount || 0
                }))
            }

            const response = await VoucherService.create(request)

            if (postImmediately) {
                await VoucherService.post(response.id)
                toast.success('Comprobante creado y contabilizado')
            } else {
                toast.success('Comprobante guardado como borrador')
            }

            onSuccess()
            handleClose()
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al guardar comprobante')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setVoucherType('INGRESO')
        setDate(new Date().toISOString().split('T')[0])
        setDescription('')
        setReference('')
        setEntries([{ ...emptyEntry }, { ...emptyEntry }])
        onClose()
    }

    const { totalDebit, totalCredit, difference, isBalanced } = calculateTotals()

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(value)
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth='xl' fullWidth>
            <DialogTitle>
                Nuevo Comprobante Contable
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {/* Encabezado */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label='Tipo'
                            select
                            value={voucherType}
                            onChange={(e) => setVoucherType(e.target.value as any)}
                            SelectProps={{ native: true }}
                        >
                            <option value='INGRESO'>Ingreso</option>
                            <option value='EGRESO'>Egreso</option>
                            <option value='NOTA_CONTABLE'>Nota Contable</option>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <TextField
                            fullWidth
                            label='Fecha'
                            type='date'
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label='Descripción'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Referencia (Opcional)'
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder='Ej: Factura #123, Recibo #456'
                        />
                    </Grid>

                    {/* Tabla de líneas */}
                    <Grid item xs={12}>
                        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
                            <Typography variant='h6'>Detalle del Asiento</Typography>
                            <Button startIcon={<Add />} onClick={handleAddLine} variant='outlined' size='small'>
                                Agregar Línea
                            </Button>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table size='small'>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width='25%'><strong>Cuenta</strong></TableCell>
                                        <TableCell width='15%'><strong>Tercero</strong></TableCell>
                                        <TableCell width='15%'><strong>Centro Costo</strong></TableCell>
                                        <TableCell width='20%'><strong>Descripción</strong></TableCell>
                                        <TableCell width='10%' align='right'><strong>Débito</strong></TableCell>
                                        <TableCell width='10%' align='right'><strong>Crédito</strong></TableCell>
                                        <TableCell width='5%'></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {entries.map((entry, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Autocomplete
                                                    options={accounts}
                                                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                                                    onChange={(_, value) => handleAccountChange(index, value)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder='Seleccione cuenta' size='small' />
                                                    )}
                                                    size='small'
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Autocomplete
                                                    options={contacts}
                                                    getOptionLabel={(option) => option.fullName}
                                                    onChange={(_, value) => handleContactChange(index, value)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder='Opcional' size='small' />
                                                    )}
                                                    size='small'
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Autocomplete
                                                    options={costCenters}
                                                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                                                    onChange={(_, value) => handleCostCenterChange(index, value)}
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder='Opcional' size='small' />
                                                    )}
                                                    size='small'
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth
                                                    value={entry.description}
                                                    onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                                                    placeholder='Descripción'
                                                    size='small'
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth
                                                    type='number'
                                                    value={entry.debitAmount || ''}
                                                    onChange={(e) => handleEntryChange(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                                                    size='small'
                                                    inputProps={{ min: 0, step: 100 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth
                                                    type='number'
                                                    value={entry.creditAmount || ''}
                                                    onChange={(e) => handleEntryChange(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                                                    size='small'
                                                    inputProps={{ min: 0, step: 100 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size='small'
                                                    color='error'
                                                    onClick={() => handleRemoveLine(index)}
                                                    disabled={entries.length <= 2}
                                                >
                                                    <Delete fontSize='small' />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Fila de totales */}
                                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                                        <TableCell colSpan={4} align='right'><strong>TOTALES:</strong></TableCell>
                                        <TableCell align='right'>
                                            <Typography variant='body2' fontWeight='bold' color='primary.main'>
                                                {formatCurrency(totalDebit)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='right'>
                                            <Typography variant='body2' fontWeight='bold' color='success.main'>
                                                {formatCurrency(totalCredit)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Grid>

                    {/* Validación de balance */}
                    <Grid item xs={12}>
                        <Box display='flex' alignItems='center' gap={2}>
                            <Typography variant='body1'>
                                <strong>Diferencia:</strong>
                            </Typography>
                            <Chip
                                label={formatCurrency(Math.abs(difference))}
                                color={isBalanced ? 'success' : 'error'}
                                icon={isBalanced ? <Check /> : <Close />}
                            />
                            {isBalanced && (
                                <Typography variant='body2' color='success.main'>
                                    ✓ Comprobante balanceado
                                </Typography>
                            )}
                            {!isBalanced && (
                                <Typography variant='body2' color='error.main'>
                                    ✗ Débitos y créditos no coinciden
                                </Typography>
                            )}
                        </Box>
                    </Grid>

                    {!isBalanced && (
                        <Grid item xs={12}>
                            <Alert severity='warning'>
                                El comprobante no está balanceado. Solo podrás guardarlo como borrador.
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} startIcon={<Close />}>
                    Cancelar
                </Button>
                <Button
                    onClick={() => handleSubmit(false)}
                    variant='outlined'
                    disabled={loading}
                    startIcon={<Save />}
                >
                    Guardar Borrador
                </Button>
                <Button
                    onClick={() => handleSubmit(true)}
                    variant='contained'
                    disabled={loading || !isBalanced}
                    startIcon={<Check />}
                >
                    Guardar y Contabilizar
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default VoucherFormDialog
