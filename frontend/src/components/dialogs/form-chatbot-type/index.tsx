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
import type { ChatbotTypeConfig } from '@/types/apps/chatbotTypes'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ChatbotTypeFormProps {
    open: boolean
    onClose: () => void
    rowSelect: ChatbotTypeConfig | null
}

const ChatbotTypeForm = ({ open, onClose, rowSelect }: ChatbotTypeFormProps) => {
    const [formData, setFormData] = useState<ChatbotTypeConfig>({
        typeName: '',
        description: '',
        webhookUrl: '',
        status: true
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (rowSelect && rowSelect.id) {
            setFormData(rowSelect)
        } else {
            setFormData({
                typeName: '',
                description: '',
                webhookUrl: '',
                status: true
            })
        }
    }, [rowSelect])

    const handleChange = (field: keyof ChatbotTypeConfig, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async () => {
        setError(null)

        // Validación
        if (!formData.typeName || !formData.webhookUrl) {
            setError('El nombre del tipo y la URL del webhook son obligatorios')
            return
        }

        setLoading(true)

        try {
            const token = localStorage.getItem('AuthToken')

            if (formData.id) {
                // Actualizar
                await axiosInstance.put(
                    `${API_BASE_URL}/chatbot-types/${formData.id}`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                toast.success('Tipo de chatbot actualizado correctamente')
            } else {
                // Crear
                await axiosInstance.post(
                    `${API_BASE_URL}/chatbot-types`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
                )
                toast.success('Tipo de chatbot creado correctamente')
            }

            onClose()
        } catch (error: any) {
            console.error('Error al guardar:', error)
            setError(error.response?.data?.message || 'Error al guardar el tipo de chatbot')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
            <DialogTitle>
                {formData.id ? 'Editar Tipo de Chatbot' : 'Nuevo Tipo de Chatbot'}
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
                            label='Nombre del Tipo'
                            value={formData.typeName}
                            onChange={e => handleChange('typeName', e.target.value)}
                            placeholder='SALES, SUPPORT, SCHEDULING'
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
                            placeholder='Describe este tipo de chatbot...'
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label='URL del Webhook n8n'
                            value={formData.webhookUrl}
                            onChange={e => handleChange('webhookUrl', e.target.value)}
                            placeholder='https://autobot.cloudfly.com.co/webhook/...'
                            required
                            helperText='Esta URL será asignada automáticamente cuando un tenant seleccione este tipo de chatbot'
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
