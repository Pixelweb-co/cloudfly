'use client'

import { useState } from 'react'
import { payrollPeriodService } from '@/services/hr/payrollPeriodService'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Alert
} from '@mui/material'

interface PeriodFormDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function PeriodFormDialog({ open, onClose, onSuccess }: PeriodFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const currentYear = new Date().getFullYear()

    const [formData, setFormData] = useState({
        periodType: 'BIWEEKLY',
        periodNumber: 1,
        year: currentYear,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        paymentDate: '',
        description: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const periodData = {
                ...formData,
                periodNumber: parseInt(formData.periodNumber.toString()),
                year: parseInt(formData.year.toString()),
                status: 'OPEN' as const
            }

            await payrollPeriodService.create(periodData, 1)
            onSuccess()
            handleClose()
        } catch (err: any) {
            setError(err.message || 'Error al crear periodo')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setFormData({
            periodType: 'BIWEEKLY',
            periodNumber: 1,
            year: currentYear,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            paymentDate: '',
            description: ''
        })
        setError(null)
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Nuevo Periodo de Nómina</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Tipo de Periodo"
                                name="periodType"
                                value={formData.periodType}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="WEEKLY">Semanal</MenuItem>
                                <MenuItem value="BIWEEKLY">Quincenal</MenuItem>
                                <MenuItem value="MONTHLY">Mensual</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="Número"
                                name="periodNumber"
                                type="number"
                                value={formData.periodNumber}
                                onChange={handleChange}
                                required
                                inputProps={{ min: 1, max: 24 }}
                                helperText="1-24"
                            />
                        </Grid>

                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                label="Año"
                                name="year"
                                type="number"
                                value={formData.year}
                                onChange={handleChange}
                                required
                                inputProps={{ min: 2020, max: 2030 }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha Inicio"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha Fin"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha de Pago"
                                name="paymentDate"
                                type="date"
                                value={formData.paymentDate}
                                onChange={handleChange}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ej: Quincena 24 - Diciembre 2025"
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Guardando...' : 'Crear Periodo'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}
