'use client'

/**
 * Componente: Sección de Resoluciones DIAN
 */

import React, { useState } from 'react'
import {
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Tooltip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Grid,
    Alert,
    CircularProgress,
    LinearProgress
} from '@mui/material'
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import type { DianResolution, DianResolutionRequest } from '@/types/dian'
import { DianDocumentType, DocumentTypeLabels } from '@/types/dian'
import { format } from 'date-fns'

interface Props {
    resolutions: DianResolution[]
    companyId: number
    loading: boolean
    onCreate: (data: DianResolutionRequest) => Promise<void>
    onUpdate: (id: number, data: DianResolutionRequest) => Promise<void>
    onDelete: (id: number) => Promise<void>
}

export default function DianResolutionsSection({
    resolutions,
    companyId,
    loading,
    onCreate,
    onUpdate,
    onDelete
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingResolution, setEditingResolution] = useState<DianResolution | null>(null)

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DianResolutionRequest>({
        defaultValues: {
            companyId: companyId,
            documentType: DianDocumentType.INVOICE,
            prefix: '',
            numberRangeFrom: 1,
            numberRangeTo: 1000,
            technicalKey: '',
            resolutionNumber: '',
            validFrom: '',
            validTo: '',
            active: true
        }
    })

    const handleOpenDialog = (resolution?: DianResolution) => {
        if (resolution) {
            setEditingResolution(resolution)
            reset({
                companyId: resolution.companyId,
                documentType: resolution.documentType,
                prefix: resolution.prefix,
                numberRangeFrom: resolution.numberRangeFrom,
                numberRangeTo: resolution.numberRangeTo,
                technicalKey: resolution.technicalKey,
                resolutionNumber: resolution.resolutionNumber || '',
                validFrom: resolution.validFrom,
                validTo: resolution.validTo,
                active: resolution.active
            })
        } else {
            setEditingResolution(null)
            reset({
                companyId: companyId,
                documentType: DianDocumentType.INVOICE,
                prefix: '',
                numberRangeFrom: 1,
                numberRangeTo: 1000,
                technicalKey: '',
                resolutionNumber: '',
                validFrom: '',
                validTo: '',
                active: true
            })
        }
        setDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setEditingResolution(null)
    }

    const onSubmit = async (data: DianResolutionRequest) => {
        try {
            if (editingResolution) {
                await onUpdate(editingResolution.id, data)
            } else {
                await onCreate(data)
            }
            handleCloseDialog()
        } catch (error) {
            console.error('Error guardando resolución:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy')
        } catch {
            return dateStr
        }
    }

    const calculateProgress = (resolution: DianResolution) => {
        const total = resolution.numberRangeTo - resolution.numberRangeFrom + 1
        const used = resolution.currentNumber - resolution.numberRangeFrom
        return (used / total) * 100
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Resoluciones de Facturación</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    disabled={loading}
                >
                    Agregar Resolución
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : resolutions.length === 0 ? (
                <Alert severity="info">
                    No hay resoluciones configuradas. Agregue al menos una resolución DIAN para empezar a facturar.
                </Alert>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Tipo Documento</strong></TableCell>
                                <TableCell><strong>Prefijo</strong></TableCell>
                                <TableCell><strong>Rango</strong></TableCell>
                                <TableCell><strong>Uso</strong></TableCell>
                                <TableCell><strong>Vigencia</strong></TableCell>
                                <TableCell align="center"><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resolutions.map((res) => {
                                const progress = calculateProgress(res)
                                const isAlmostFull = progress > 80

                                return (
                                    <TableRow key={res.id} hover>
                                        <TableCell>{DocumentTypeLabels[res.documentType]}</TableCell>
                                        <TableCell>
                                            <Chip label={res.prefix} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontFamily="monospace">
                                                {res.numberRangeFrom.toLocaleString()} - {res.numberRangeTo.toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ minWidth: 150 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption">
                                                        {res.currentNumber.toLocaleString()} / {res.numberRangeTo.toLocaleString()}
                                                    </Typography>
                                                    <Typography variant="caption" color={isAlmostFull ? 'error' : 'text.secondary'}>
                                                        {progress.toFixed(0)}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={progress}
                                                    color={isAlmostFull ? 'error' : 'primary'}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    Quedan: {res.remainingNumbers?.toLocaleString()}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(res.validFrom)} - {formatDate(res.validTo)}
                                            </Typography>
                                            {!res.isValid && (
                                                <Chip label="Expirada" color="error" size="small" sx={{ mt: 0.5 }} />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={res.active ? 'Activa' : 'Inactiva'}
                                                color={res.active ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Editar">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenDialog(res)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => {
                                                        if (window.confirm('¿Está seguro de eliminar esta resolución?')) {
                                                            onDelete(res.id)
                                                        }
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Diálogo de formulario */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingResolution ? 'Editar Resolución' : 'Nueva Resolución'}
                </DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogContent>
                        <Grid container spacing={3}>
                            {/* Tipo de Documento */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="documentType"
                                    control={control}
                                    rules={{ required: 'El tipo de documento es requerido' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Tipo de Documento"
                                            error={!!errors.documentType}
                                            helperText={errors.documentType?.message}
                                        >
                                            {Object.values(DianDocumentType).map((type) => (
                                                <MenuItem key={type} value={type}>
                                                    {DocumentTypeLabels[type]}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                            </Grid>

                            {/* Prefijo */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="prefix"
                                    control={control}
                                    rules={{ required: 'El prefijo es requerido' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Prefijo"
                                            placeholder="Ej: FE, NC, ND"
                                            error={!!errors.prefix}
                                            helperText={errors.prefix?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Rango Desde */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="numberRangeFrom"
                                    control={control}
                                    rules={{
                                        required: 'El rango inicial es requerido',
                                        min: { value: 1, message: 'Debe ser mayor a 0' }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            fullWidth
                                            label="Rango Desde"
                                            error={!!errors.numberRangeFrom}
                                            helperText={errors.numberRangeFrom?.message}
                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Rango Hasta */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="numberRangeTo"
                                    control={control}
                                    rules={{
                                        required: 'El rango final es requerido',
                                        min: { value: 1, message: 'Debe ser mayor a 0' }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            fullWidth
                                            label="Rango Hasta"
                                            error={!!errors.numberRangeTo}
                                            helperText={errors.numberRangeTo?.message}
                                            onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Clave Técnica */}
                            <Grid item xs={12}>
                                <Controller
                                    name="technicalKey"
                                    control={control}
                                    rules={{ required: 'La clave técnica es requerida' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Clave Técnica"
                                            error={!!errors.technicalKey}
                                            helperText={errors.technicalKey?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Número de Resolución */}
                            <Grid item xs={12}>
                                <Controller
                                    name="resolutionNumber"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            label="Número de Resolución DIAN (opcional)"
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Vigencia Desde */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="validFrom"
                                    control={control}
                                    rules={{ required: 'La fecha de inicio es requerida' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            fullWidth
                                            label="Vigencia Desde"
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.validFrom}
                                            helperText={errors.validFrom?.message}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Vigencia Hasta */}
                            <Grid item xs={12} sm={6}>
                                <Controller
                                    name="validTo"
                                    control={control}
                                    rules={{ required: 'La fecha de fin es requerida' }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="date"
                                            fullWidth
                                            label="Vigencia Hasta"
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.validTo}
                                            helperText={errors.validTo?.message}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    )
}
