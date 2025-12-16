'use client'

import { useState, useEffect } from 'react'
import {
    Card, CardContent, Grid, TextField, Button, Typography, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Alert
} from '@mui/material'
import {
    Add, Edit, Delete, Search, AccountTree, FolderOpen, Folder
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import axiosInstance from '@/utils/axiosInterceptor'

interface CostCenter {
    id?: number
    code: string
    name: string
    description: string
    parentId: number | null
    isActive: boolean
}

const CentrosCostoView = () => {
    const [centers, setCenters] = useState<CostCenter[]>([])
    const [filteredCenters, setFilteredCenters] = useState<CostCenter[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null)
    const [formData, setFormData] = useState<CostCenter>({
        code: '',
        name: '',
        description: '',
        parentId: null,
        isActive: true
    })

    useEffect(() => {
        loadCenters()
    }, [])

    useEffect(() => {
        filterCenters()
    }, [searchTerm, centers])

    const loadCenters = async () => {
        setLoading(true)
        try {
            const response = await axiosInstance.get('/cost-centers')
            setCenters(response.data)
            toast.success('Centros de costo cargados')
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al cargar centros de costo')
        } finally {
            setLoading(false)
        }
    }

    const filterCenters = () => {
        if (!searchTerm) {
            setFilteredCenters(centers)
            return
        }

        const filtered = centers.filter(center =>
            center.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            center.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredCenters(filtered)
    }

    const handleOpenDialog = (center?: CostCenter) => {
        if (center) {
            setEditingCenter(center)
            setFormData(center)
        } else {
            setEditingCenter(null)
            setFormData({
                code: '',
                name: '',
                description: '',
                parentId: null,
                isActive: true
            })
        }
        setDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setEditingCenter(null)
        setFormData({
            code: '',
            name: '',
            description: '',
            parentId: null,
            isActive: true
        })
    }

    const handleSubmit = async () => {
        if (!formData.code || !formData.name) {
            toast.error('Código y nombre son requeridos')
            return
        }

        try {
            if (editingCenter) {
                await axiosInstance.put(`/cost-centers/${editingCenter.id}`, formData)
                toast.success('Centro de costo actualizado')
            } else {
                await axiosInstance.post('/cost-centers', formData)
                toast.success('Centro de costo creado')
            }
            handleCloseDialog()
            loadCenters()
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al guardar')
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Está seguro de eliminar este centro de costo?')) return

        try {
            await axiosInstance.delete(`/cost-centers/${id}`)
            toast.success('Centro de costo eliminado')
            loadCenters()
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al eliminar')
        }
    }

    const getParentName = (parentId: number | null) => {
        if (!parentId) return '-'
        const parent = centers.find(c => c.id === parentId)
        return parent ? `${parent.code} - ${parent.name}` : '-'
    }

    const stats = {
        total: centers.length,
        active: centers.filter(c => c.isActive).length,
        root: centers.filter(c => !c.parentId).length,
        withParent: centers.filter(c => c.parentId).length
    }

    return (
        <Grid container spacing={6}>
            {/* Header y Filtros */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
                            <Typography variant='h5'>
                                🏢 Centros de Costo
                            </Typography>
                            <Button
                                variant='contained'
                                startIcon={<Add />}
                                onClick={() => handleOpenDialog()}
                            >
                                Nuevo Centro
                            </Button>
                        </Box>

                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label='Buscar'
                                    placeholder='Código o nombre...'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                                    }}
                                />
                            </Grid>
                        </Grid>
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
                        <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant='h6'>Activos</Typography>
                                <Typography variant='h3'>{stats.active}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant='h6'>Raíz</Typography>
                                <Typography variant='h3'>{stats.root}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}>
                        <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
                            <CardContent>
                                <Typography variant='h6'>Con Padre</Typography>
                                <Typography variant='h3'>{stats.withParent}</Typography>
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
                        ) : filteredCenters.length === 0 ? (
                            <Alert severity='info'>No hay centros de costo registrados</Alert>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Código</strong></TableCell>
                                            <TableCell><strong>Nombre</strong></TableCell>
                                            <TableCell><strong>Descripción</strong></TableCell>
                                            <TableCell><strong>Centro Padre</strong></TableCell>
                                            <TableCell><strong>Estado</strong></TableCell>
                                            <TableCell align='right'><strong>Acciones</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredCenters.map((center) => (
                                            <TableRow key={center.id} hover>
                                                <TableCell>
                                                    <Box display='flex' alignItems='center' gap={1}>
                                                        {center.parentId ? (
                                                            <Folder fontSize='small' color='action' />
                                                        ) : (
                                                            <FolderOpen fontSize='small' color='primary' />
                                                        )}
                                                        <Typography variant='body2' fontFamily='monospace' fontWeight='bold'>
                                                            {center.code}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>{center.name}</TableCell>
                                                <TableCell>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        {center.description || '-'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant='body2' color='text.secondary'>
                                                        {getParentName(center.parentId)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={center.isActive ? 'Activo' : 'Inactivo'}
                                                        color={center.isActive ? 'success' : 'default'}
                                                        size='small'
                                                    />
                                                </TableCell>
                                                <TableCell align='right'>
                                                    <IconButton
                                                        size='small'
                                                        color='primary'
                                                        onClick={() => handleOpenDialog(center)}
                                                    >
                                                        <Edit fontSize='small' />
                                                    </IconButton>
                                                    <IconButton
                                                        size='small'
                                                        color='error'
                                                        onClick={() => handleDelete(center.id!)}
                                                    >
                                                        <Delete fontSize='small' />
                                                    </IconButton>
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

            {/* Dialog Form */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
                <DialogTitle>
                    {editingCenter ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label='Código'
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label='Estado'
                                select
                                value={formData.isActive ? 'true' : 'false'}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                SelectProps={{ native: true }}
                            >
                                <option value='true'>Activo</option>
                                <option value='false'>Inactivo</option>
                            </TextField>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label='Nombre'
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label='Centro Padre (Opcional)'
                                select
                                value={formData.parentId || ''}
                                onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}
                                SelectProps={{ native: true }}
                            >
                                <option value=''>Sin padre (raíz)</option>
                                {centers
                                    .filter(c => c.id !== editingCenter?.id)
                                    .map(center => (
                                        <option key={center.id} value={center.id}>
                                            {center.code} - {center.name}
                                        </option>
                                    ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label='Descripción'
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                multiline
                                rows={3}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant='contained'>
                        {editingCenter ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    )
}

export default CentrosCostoView
