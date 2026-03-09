'use client'

/**
 * Componente: Sección de Certificados DIAN
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
    Alert,
    CircularProgress
} from '@mui/material'
import {
    Delete as DeleteIcon,
    CheckCircle as ActiveIcon,
    RadioButtonUnchecked as InactiveIcon,
    Upload as UploadIcon
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import type { DianCertificate } from '@/types/dian'
import { CertificateType, CertificateTypeLabels } from '@/types/dian'
import { format } from 'date-fns'

interface Props {
    certificates: DianCertificate[]
    companyId: number
    loading: boolean
    onUpload: (file: File, alias: string, type: CertificateType, password: string) => Promise<void>
    onActivate: (id: number) => Promise<void>
    onDeactivate: (id: number) => Promise<void>
    onDelete: (id: number) => Promise<void>
}

interface UploadFormData {
    alias: string
    type: CertificateType
    password: string
}

export default function DianCertificatesSection({
    certificates,
    companyId,
    loading,
    onUpload,
    onActivate,
    onDeactivate,
    onDelete
}: Props) {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UploadFormData>({
        defaultValues: {
            alias: '',
            type: CertificateType.P12,
            password: ''
        }
    })

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0])
        }
    }

    const onSubmitUpload = async (data: UploadFormData) => {
        if (!selectedFile) {
            alert('Por favor seleccione un archivo')
            return
        }

        try {
            await onUpload(selectedFile, data.alias, data.type, data.password)
            setUploadDialogOpen(false)
            setSelectedFile(null)
            reset()
        } catch (error) {
            console.error('Error subiendo certificado:', error)
        }
    }

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-'
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy HH:mm')
        } catch {
            return dateStr
        }
    }

    return (
        <Box>
            {/* Header con botón de subir */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Certificados Digitales</Typography>
                <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    disabled={loading}
                >
                    Subir Certificado
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : certificates.length === 0 ? (
                <Alert severity="info">
                    No hay certificados configurados. Suba un certificado digital para firmar documentos electrónicos.
                </Alert>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Alias</strong></TableCell>
                                <TableCell><strong>Tipo</strong></TableCell>
                                <TableCell><strong>Emisor</strong></TableCell>
                                <TableCell><strong>Vigencia Desde</strong></TableCell>
                                <TableCell><strong>Vigencia Hasta</strong></TableCell>
                                <TableCell align="center"><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {certificates.map((cert) => (
                                <TableRow key={cert.id} hover>
                                    <TableCell>{cert.alias}</TableCell>
                                    <TableCell>
                                        <Chip label={CertificateTypeLabels[cert.type]} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {cert.issuer || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{formatDate(cert.validFrom)}</TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {formatDate(cert.validTo)}
                                            </Typography>
                                            {!cert.isValid && (
                                                <Chip label="Expirado" color="error" size="small" sx={{ mt: 0.5 }} />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={cert.active ? 'Activo' : 'Inactivo'}
                                            color={cert.active ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {cert.active ? (
                                            <Tooltip title="Desactivar">
                                                <IconButton
                                                    size="small"
                                                    color="warning"
                                                    onClick={() => onDeactivate(cert.id)}
                                                >
                                                    <InactiveIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="Activar">
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => onActivate(cert.id)}
                                                >
                                                    <ActiveIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    if (window.confirm('¿Está seguro de eliminar este certificado?')) {
                                                        onDelete(cert.id)
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Diálogo de subida */}
            <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Subir Certificado Digital</DialogTitle>
                <form onSubmit={handleSubmit(onSubmitUpload)}>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Selector de archivo */}
                            <Box>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    startIcon={<UploadIcon />}
                                >
                                    {selectedFile ? selectedFile.name : 'Seleccionar archivo'}
                                    <input
                                        type="file"
                                        hidden
                                        accept=".p12,.pfx,.pem"
                                        onChange={handleFileSelect}
                                    />
                                </Button>
                                {selectedFile && (
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Archivo: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                    </Typography>
                                )}
                            </Box>

                            {/* Alias */}
                            <Controller
                                name="alias"
                                control={control}
                                rules={{ required: 'El alias es requerido' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Alias"
                                        placeholder="Ej: Certificado Producción 2024"
                                        error={!!errors.alias}
                                        helperText={errors.alias?.message}
                                    />
                                )}
                            />

                            {/* Tipo */}
                            <Controller
                                name="type"
                                control={control}
                                rules={{ required: 'El tipo es requerido' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Tipo de Certificado"
                                        error={!!errors.type}
                                        helperText={errors.type?.message}
                                    >
                                        {Object.values(CertificateType).map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {CertificateTypeLabels[type]}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />

                            {/* Contraseña */}
                            <Controller
                                name="password"
                                control={control}
                                rules={{ required: 'La contraseña es requerida' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        type="password"
                                        label="Contraseña del Certificado"
                                        error={!!errors.password}
                                        helperText={errors.password?.message}
                                    />
                                )}
                            />

                            <Alert severity="info">
                                El certificado será verificado y se extraerán automáticamente los metadatos (emisor, vigencia, etc.).
                            </Alert>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setUploadDialogOpen(false)} disabled={isSubmitting}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting || !selectedFile}>
                            {isSubmitting ? 'Subiendo...' : 'Subir'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    )
}
