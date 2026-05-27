'use client'

import { useState, useEffect } from 'react'
import {
    Card, CardContent, Grid, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, CircularProgress, Alert, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, MenuItem, Tooltip
} from '@mui/material'
import {
    Add, Edit, Delete, Search, Download, Refresh,
    AccountBalance, TrendingUp, TrendingDown, Remove
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

interface ChartOfAccount {
    id?: number
    code: string
    name: string
    accountType: 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO' | 'COSTO'
    level: number
    parentCode?: string
    nature: 'DEBITO' | 'CREDITO'
    requiresThirdParty: boolean
    requiresCostCenter: boolean
    isActive: boolean
    isSystem: boolean
}

const accountTypeOptions = [
    { value: 'ACTIVO', label: 'Activo', color: 'primary' },
    { value: 'PASIVO', label: 'Pasivo', color: 'error' },
    { value: 'PATRIMONIO', label: 'Patrimonio', color: 'success' },
    { value: 'INGRESO', label: 'Ingreso', color: 'info' },
    { value: 'GASTO', label: 'Gasto', color: 'warning' },
    { value: 'COSTO', label: 'Costo', color: 'secondary' }
]

const PlanCuentasView = () => {
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
    const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<string>('')
    const [openDialog, setOpenDialog] = useState(false)
    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)

    const [formData, setFormData] = useState<ChartOfAccount>({
        code: '',
        name: '',
        accountType: 'ACTIVO',
        level: 1,
        parentCode: '',
        nature: 'DEBITO',
        requiresThirdParty: false,
        requiresCostCenter: false,
        isActive: true,
        isSystem: false
    })

    useEffect(() => {
        loadAccounts()
    }, [])

    useEffect(() => {
        filterAccounts()
    }, [searchTerm, filterType, accounts])

    const loadAccounts = async () => {
        setLoading(true)
        try {
            const response = await axiosInstance.get('/chart-of-accounts')
            setAccounts(response.data)
            toast.success('Plan de cuentas cargado')
        } catch (error) {
            console.error('Error loading accounts:', error)
            toast.error('Error al cargar plan de cuentas')
        } finally {
            setLoading(false)
        }
    }

    const filterAccounts = () => {
        let filtered = accounts

        if (searchTerm) {
            filtered = filtered.filter(acc =>
                acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        if (filterType) {
            filtered = filtered.filter(acc => acc.accountType === filterType)
        }

        setFilteredAccounts(filtered)
    }

    const handleOpenDialog = (account?: ChartOfAccount) => {
        if (account) {
            setEditingAccount(account)
            setFormData(account)
        } else {
            setEditingAccount(null)
            setFormData({
                code: '',
                name: '',
                accountType: 'ACTIVO',
                level: 1,
                nature: 'DEBITO',
                requiresThirdParty: false,
                requiresCostCenter: false,
                isActive: true,
                isSystem: false
            })
        }
        setOpenDialog(true)
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
        setEditingAccount(null)
    }

    const handleSave = async () => {
        if (!formData.code || !formData.name) {
            toast.error('Complete los campos requeridos')
            return
        }

        try {
            if (editingAccount) {
                await axiosInstance.put(`/chart-of-accounts/${editingAccount.id}`, formData)
                toast.success('Cuenta actualizada')
            } else {
                await axiosInstance.post('/chart-of-accounts', formData)
                toast.success('Cuenta creada')
            }
            handleCloseDialog()
            loadAccounts()
        } catch (error) {
            console.error('Error saving account:', error)
            toast.error('Error al guardar cuenta')
        }
    }

    const handleDelete = async (id: number, isSystem: boolean) => {
        if (isSystem) {
            toast.error('No se puede eliminar una cuenta del sistema')
            return
        }

        if (!confirm('¿Está seguro de eliminar esta cuenta?')) return

        try {
            await axiosInstance.delete(`/chart-of-accounts/${id}`)
            toast.success('Cuenta eliminada')
            loadAccounts()
        } catch (error) {
            console.error('Error deleting account:', error)
            toast.error('Error al eliminar cuenta')
        }
    }

    const getTypeChip = (type: string) => {
        const option = accountTypeOptions.find(o => o.value === type)
        return (
            <Chip
                label={option?.label || type}
                color={option?.color as any || 'default'}
                size="small"
            />
        )
    }

    const getLevelIcon = (level: number) => {
        switch (level) {
            case 1: return <AccountBalance fontSize="small" />
            case 2: return <TrendingUp fontSize="small" />
            case 3: return <TrendingDown fontSize="small" />
            default: return <Remove fontSize="small" />
        }
    }

    const stats = {
        total: accounts.length,
        activos: accounts.filter(a => a.accountType === 'ACTIVO').length,
        pasivos: accounts.filter(a => a.accountType === 'PASIVO').length,
        ingresos: accounts.filter(a => a.accountType === 'INGRESO').length,
        gastos: accounts.filter(a => a.accountType === 'GASTO').length
    }

    return (
        <Grid container spacing={6}>
            {/* Header */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                            <Typography variant="h5">
                                📊 Plan Único de Cuentas (PUC)
                            </Typography>
                            <Box display="flex" gap={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={<Refresh />}
                                    onClick={loadAccounts}
                                    disabled={loading}
                                >
                                    Actualizar
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => handleOpenDialog()}
                                >
                                    Nueva Cuenta
                                </Button>
                            </Box>
                        </Box>

                        {/* Stats */}
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={2.4}>
                                <Box textAlign="center" p={2} bgcolor="grey.100" borderRadius={2}>
                                    <Typography variant="h4">{stats.total}</Typography>
                                    <Typography variant="caption">Total Cuentas</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={2.4}>
                                <Box textAlign="center" p={2} bgcolor="primary.light" color="white" borderRadius={2}>
                                    <Typography variant="h4">{stats.activos}</Typography>
                                    <Typography variant="caption">Activos</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={2.4}>
                                <Box textAlign="center" p={2} bgcolor="error.light" color="white" borderRadius={2}>
                                    <Typography variant="h4">{stats.pasivos}</Typography>
                                    <Typography variant="caption">Pasivos</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={2.4}>
                                <Box textAlign="center" p={2} bgcolor="success.light" color="white" borderRadius={2}>
                                    <Typography variant="h4">{stats.ingresos}</Typography>
                                    <Typography variant="caption">Ingresos</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={2.4}>
                                <Box textAlign="center" p={2} bgcolor="warning.light" color="white" borderRadius={2}>
                                    <Typography variant="h4">{stats.gastos}</Typography>
                                    <Typography variant="caption">Gastos</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Filters */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    placeholder="Buscar por código o nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search className="mr-2" />
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Filtrar por Tipo"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    {accountTypeOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>

            {/* Table */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        {loading ? (
                            <Box display="flex" justifyContent="center" p={4}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width={50}>Nivel</TableCell>
                                            <TableCell width={120}><strong>Código</strong></TableCell>
                                            <TableCell><strong>Nombre</strong></TableCell>
                                            <TableCell width={150}><strong>Tipo</strong></TableCell>
                                            <TableCell width={100}><strong>Naturaleza</strong></TableCell>
                                            <TableCell width={100}><strong>Estado</strong></TableCell>
                                            <TableCell width={120} align="right"><strong>Acciones</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredAccounts.map((account) => (
                                            <TableRow key={account.id} hover>
                                                <TableCell>
                                                    <Tooltip title={`Nivel ${account.level}`}>
                                                        {getLevelIcon(account.level)}
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
                                                        {account.code}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{account.name}</Typography>
                                                    {account.parentCode && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Padre: {account.parentCode}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>{getTypeChip(account.accountType)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={account.nature}
                                                        size="small"
                                                        color={account.nature === 'DEBITO' ? 'primary' : 'success'}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={account.isActive ? 'Activo' : 'Inactivo'}
                                                        size="small"
                                                        color={account.isActive ? 'success' : 'default'}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenDialog(account)}
                                                        disabled={account.isSystem}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDelete(account.id!, account.isSystem)}
                                                        disabled={account.isSystem}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredAccounts.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                    <Typography color="text.secondary">
                                                        No se encontraron cuentas
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            {/* Dialog Form */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Código"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Nivel"
                                type="number"
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                inputProps={{ min: 1, max: 4 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Tipo de Cuenta"
                                value={formData.accountType}
                                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                            >
                                {accountTypeOptions.map(opt => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Naturaleza"
                                value={formData.nature}
                                onChange={(e) => setFormData({ ...formData, nature: e.target.value as any })}
                            >
                                <MenuItem value="DEBITO">Débito</MenuItem>
                                <MenuItem value="CREDITO">Crédito</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Código Padre (opcional)"
                                value={formData.parentCode || ''}
                                onChange={(e) => setFormData({ ...formData, parentCode: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">Guardar</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    )
}

export default PlanCuentasView
