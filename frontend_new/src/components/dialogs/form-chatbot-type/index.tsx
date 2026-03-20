'use client'

import { useState, useEffect } from 'react'

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Switch,
    FormControlLabel,
    Grid,
    Alert
} from '@mui/material'
import toast from 'react-hot-toast'

import { axiosInstance } from '@/utils/axiosInstance'
import type { ChannelTypeConfig } from '@/types/chatbotTypes'

const API_BASE_URL = '/api' // Use relative path with axiosInstance if possible, or keep it if backend differs

interface ChannelTypeFormProps {
    open: boolean
    onClose: () => void
    rowSelect: ChannelTypeConfig | null
}

const ChannelTypeForm = ({ open, onClose, rowSelect }: ChannelTypeFormProps) => {
    const [formData, setFormData] = useState<ChannelTypeConfig>({
        typeName: '',
        name: '',
        description: '',
        webhookUrl: '',
        webhook_url: '',
        status: true
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (rowSelect && rowSelect.id) {
            setFormData({
                ...rowSelect,
                name: rowSelect.name || rowSelect.typeName,
                webhook_url: rowSelect.webhook_url || rowSelect.webhookUrl
            })
        } else {
            setFormData({
                typeName: '',
                name: '',
                description: '',
                webhookUrl: '',
                webhook_url: '',
                status: true
            })
        }
    }, [rowSelect])

    const handleChange = (field: keyof ChannelTypeConfig, value: any) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: value }

            // Sincronizar campos para compatibilidad
            if (field === 'name') newState.typeName = value
            if (field === 'typeName') newState.name = value
            if (field === 'webhook_url') newState.webhookUrl = value
            if (field === 'webhookUrl') newState.webhook_url = value

            return newState
        })
    }

    const handleSubmit = async () => {
        setError(null)

        // Validación
        if (!formData.name && !formData.typeName) {
            setError('El nombre del agente es obligatorio')

            return
        }

        if (!formData.webhook_url && !formData.webhookUrl) {
            setError('La URL del webhook es obligatoria')

            return
        }

        setLoading(true)

        try {
            if (formData.id) {
                // Actualizar
                await axiosInstance.put(
                    `/api/channel-types/${formData.id}`,
                    formData
                )
                toast.success('Agente actualizado correctamente')
            } else {
                // Crear
                await axiosInstance.post(
                    `/api/channel-types`,
                    formData
                )
                toast.success('Agente creado correctamente')
            }

            onClose()
        } catch (error: any) {
            console.error('Error al guardar:', error)
            setError(error.response?.data?.message || 'Error al guardar el agente')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>
                {formData.id ? 'Editar Agente AI' : 'Nuevo Agente AI'}
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {error && (
                        <Grid item xs={12}>
                            <Alert severity='error'>{error}</Alert>
                        </Grid>
                    )}

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label='Nombre del Agente'
                            value={formData.name || formData.typeName}
                            onChange={e => handleChange('name', e.target.value)}
                            placeholder='Ej: Asistente de Ventas'
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.status}
                                    onChange={e => handleChange('status', e.target.checked)}
                                />
                            }
                            label={formData.status ? 'Activo' : 'Inactivo'}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='Descripción'
                            value={formData.description}
                            onChange={e => handleChange('description', e.target.value)}
                            multiline
                            rows={3}
                            placeholder='Describe este tipo de canal...'
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='URL del Webhook n8n'
                            value={formData.webhook_url || formData.webhookUrl}
                            onChange={e => handleChange('webhook_url', e.target.value)}
                            placeholder='https://autobot.cloudfly.com.co/webhook/...'
                            required
                            helperText='Esta URL procesará los mensajes enviados a través de los canales asignados a este agente'
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant='outlined' disabled={loading}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} variant='contained' disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ChannelTypeForm
