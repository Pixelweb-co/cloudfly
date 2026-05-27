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
import { toast } from 'react-toastify'
import { axiosInstance } from '@/utils/axiosInstance'
import type { ChannelTypeConfig } from '@/types/apps/channelConfigTypes'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ChannelTypeFormProps {
    open: boolean
    onClose: () => void
    rowSelect: ChannelTypeConfig | null
}

const ChatbotTypeForm = ({ open, onClose, rowSelect }: ChannelTypeFormProps) => {
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
            const updated = { ...prev, [field]: value };
            
            // Sincronizar alias
            if (field === 'name') updated.typeName = value;
            if (field === 'typeName') updated.name = value;
            if (field === 'webhook_url') updated.webhookUrl = value;
            if (field === 'webhookUrl') updated.webhook_url = value;
            
            return updated;
        })
    }

    const handleSubmit = async () => {
        setError(null)

        // Validación
        if ((!formData.typeName && !formData.name) || (!formData.webhookUrl && !formData.webhook_url)) {
            setError('El nombre y la URL del webhook son obligatorios')
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('AuthToken')

            if (formData.id) {
                // Actualizar
                await axiosInstance.put(
                    `${API_BASE_URL}/api/channel-types/${formData.id}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                toast.success('Agente actualizado correctamente')
            } else {
                // Crear
                await axiosInstance.post(
                    `${API_BASE_URL}/api/channel-types`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
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
                {formData.id ? 'Editar Agente (Chatbot)' : 'Nuevo Agente (Chatbot)'}
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
                            placeholder='Ej: Ventas, Soporte, IA'
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
                            placeholder='Describe la función de este agente...'
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='URL del Webhook (n8n/Automation)'
                            value={formData.webhook_url || formData.webhookUrl}
                            onChange={e => handleChange('webhook_url', e.target.value)}
                            placeholder='https://autobot.cloudfly.com.co/webhook/...'
                            required
                            helperText='Esta URL procesará los mensajes entrantes asignados a este agente'
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

export default ChatbotTypeForm
