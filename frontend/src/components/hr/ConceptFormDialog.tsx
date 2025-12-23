'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Grid,
    Box
} from '@mui/material'
import { PayrollConcept } from '@/types/hr'

interface ConceptFormDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    concept?: PayrollConcept | null
}

type ConceptFormData = {
    code: string
    name: string
    description: string
    conceptType: 'PERCEPCION' | 'DEDUCCION'
    satCode: string
    isTaxable: boolean
    isImssSubject: boolean
    calculationFormula: string
    isActive: boolean
}

export default function ConceptFormDialog({ open, onClose, onSuccess, concept }: ConceptFormDialogProps) {
    const [formData, setFormData] = useState<ConceptFormData>({
        code: '',
        name: '',
        description: '',
        conceptType: 'PERCEPCION',
        satCode: '',
        isTaxable: true,
        isImssSubject: false,
        calculationFormula: '',
        isActive: true
    })
    const [saving, setSaving] = useState(false)

    const isEditMode = !!concept

    useEffect(() => {
        if (concept) {
            setFormData({
                code: concept.code || '',
                name: concept.name || '',
                description: concept.description || '',
                conceptType: concept.conceptType as 'PERCEPCION' | 'DEDUCCION',
                satCode: concept.satCode || '',
                isTaxable: concept.isTaxable ?? true,
                isImssSubject: concept.isImssSubject ?? false,
                calculationFormula: concept.calculationFormula || '',
                isActive: concept.isActive ?? true
            })
        } else {
            // Reset form for new concept
            setFormData({
                code: '',
                name: '',
                description: '',
                conceptType: 'PERCEPCION',
                satCode: '',
                isTaxable: true,
                isImssSubject: false,
                calculationFormula: '',
                isActive: true
            })
        }
    }, [concept, open])

    const handleChange = (field: keyof ConceptFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async () => {
        if (!formData.code || !formData.name) {
            alert('Por favor complete los campos requeridos: Código y Nombre')
            return
        }

        setSaving(true)
        try {
            const { payrollConceptService } = await import('@/services/hr/payrollConceptService')
            const customerId = 1 // TODO: Get from context

            if (isEditMode && concept) {
                await payrollConceptService.update(concept.id, formData, customerId)
            } else {
                await payrollConceptService.create(formData, customerId)
            }

            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving concept:', error)
            alert('Error al guardar el concepto')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>
                {isEditMode ? '✏️ Editar Concepto' : '➕ Nuevo Concepto'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Código *"
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                disabled={isEditMode && concept?.isSystemConcept}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                            <TextField
                                fullWidth
                                label="Nombre *"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                multiline
                                rows={2}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Tipo *</InputLabel>
                                <Select
                                    value={formData.conceptType}
                                    onChange={(e) => handleChange('conceptType', e.target.value)}
                                    label="Tipo *"
                                >
                                    <MenuItem value="PERCEPCION">Percepción (Ingreso)</MenuItem>
                                    <MenuItem value="DEDUCCION">Deducción (Descuento)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Código SAT"
                                value={formData.satCode}
                                onChange={(e) => handleChange('satCode', e.target.value)}
                                size="small"
                                helperText="Código del catálogo SAT"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Fórmula de Cálculo"
                                value={formData.calculationFormula}
                                onChange={(e) => handleChange('calculationFormula', e.target.value)}
                                size="small"
                                placeholder="Ej: salario_base * 0.15"
                                helperText="Fórmula para cálculo automático (opcional)"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isTaxable}
                                            onChange={(e) => handleChange('isTaxable', e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Gravable (aplica ISR)"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isImssSubject}
                                            onChange={(e) => handleChange('isImssSubject', e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Integra IMSS/Seguridad Social"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isActive}
                                            onChange={(e) => handleChange('isActive', e.target.checked)}
                                            color="success"
                                        />
                                    }
                                    label="Activo"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit" disabled={saving}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? 'Guardando...' : isEditMode ? '💾 Actualizar' : '💾 Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
