'use client'

/**
 * Componente: Formulario de Modo de Operación DIAN
 */

import React, { useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Grid,
    Alert
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import type { DianOperationMode, DianOperationModeRequest } from '@/types/dian'
import { DianDocumentType, DianEnvironment, DocumentTypeLabels, EnvironmentLabels } from '@/types/dian'

interface Props {
    open: boolean
    mode?: DianOperationMode | null
    companyId: number
    onClose: () => void
    onSave: (data: DianOperationModeRequest) => Promise<void>
}

export default function DianOperationModeForm({ open, mode, companyId, onClose, onSave }: Props) {
    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DianOperationModeRequest>({
        defaultValues: {
            companyId: companyId,
            documentType: DianDocumentType.INVOICE,
            environment: DianEnvironment.TEST,
            softwareId: '',
            pin: '',
            testSetId: '',
            certificationProcess: false,
            active: true
        }
    })

    useEffect(() => {
        if (mode) {
            reset({
                companyId: mode.companyId,
                documentType: mode.documentType,
                environment: mode.environment,
                softwareId: mode.softwareId,
                pin: mode.pin,
                testSetId: mode.testSetId || '',
                certificationProcess: mode.certificationProcess,
                active: mode.active
            })
        } else {
            reset({
                companyId: companyId,
                documentType: DianDocumentType.INVOICE,
                environment: DianEnvironment.TEST,
                softwareId: '',
                pin: '',
                testSetId: '',
                certificationProcess: false,
                active: true
            })
        }
    }, [mode, companyId, reset])

    const onSubmit = async (data: DianOperationModeRequest) => {
        try {
            await onSave(data)
            onClose()
        } catch (error) {
            console.error('Error guardando modo:', error)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {mode ? 'Editar Modo de Operación' : 'Nuevo Modo de Operación'}
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

                        {/* Ambiente */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="environment"
                                control={control}
                                rules={{ required: 'El ambiente es requerido' }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Ambiente"
                                        error={!!errors.environment}
                                        helperText={errors.environment?.message}
                                    >
                                        {Object.values(DianEnvironment).map((env) => (
                                            <MenuItem key={env} value={env}>
                                                {EnvironmentLabels[env]}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Grid>

                        {/* Software ID */}
                        <Grid item xs={12}>
                            <Controller
                                name="softwareId"
                                control={control}
                                rules={{
                                    required: 'El Software ID es requerido',
                                    maxLength: { value: 100, message: 'Máximo 100 caracteres' }
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Software ID"
                                        error={!!errors.softwareId}
                                        helperText={errors.softwareId?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* PIN */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="pin"
                                control={control}
                                rules={{
                                    required: 'El PIN es requerido',
                                    minLength: { value: 4, message: 'Mínimo 4 caracteres' },
                                    maxLength: { value: 10, message: 'Máximo 10 caracteres' }
                                }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="PIN"
                                        type="password"
                                        error={!!errors.pin}
                                        helperText={errors.pin?.message}
                                    />
                                )}
                            />
                        </Grid>

                        {/* Test Set ID */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="testSetId"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        label="Test Set ID (opcional)"
                                        helperText="Solo para ambiente de pruebas"
                                    />
                                )}
                            />
                        </Grid>

                        {/* Checkboxes */}
                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="certificationProcess"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="En proceso de certificación"
                                    />
                                )}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Controller
                                name="active"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        control={<Checkbox {...field} checked={field.value} />}
                                        label="Activo"
                                    />
                                )}
                            />
                        </Grid>

                        {mode?.environment === DianEnvironment.PRODUCTION && (
                            <Grid item xs={12}>
                                <Alert severity="warning">
                                    <strong>Advertencia:</strong> Está modificando un modo en PRODUCCIÓN.
                                    Verifique todos los datos antes de guardar.
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}
