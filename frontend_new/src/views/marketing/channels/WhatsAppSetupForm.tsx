'use client'

import { useState, useEffect } from 'react'
import { 
    Typography, Box, Button, TextField, Grid, Alert, CircularProgress, 
    Divider, Stepper, Step, StepLabel, MenuItem, Select, FormControl, InputLabel 
} from '@mui/material'
import { channelService } from '@/services/marketing/channelService'
import { agentService } from '@/services/marketing/agentService'

const STEPS = ['Conexión QR', 'Especialidad AI']

interface Props {
    accessToken: string
    onComplete: () => void
    onCancel: () => void
}

const WhatsAppSetupForm = ({ accessToken, onComplete, onCancel }: Props) => {
    const [activeStep, setActiveStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

    // Templates and Selection
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('')
    const [displayName, setDisplayName] = useState('')
    const [businessContext, setBusinessContext] = useState('')
    const [businessName, setBusinessName] = useState('')

    // Fetch templates on load
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await agentService.getTemplates(accessToken)
                setTemplates(data)
                // Default selection if available
                if (data.length > 0) setSelectedTemplateId(data[0].id)
            } catch (err) {
                console.error('Error fetching templates:', err)
            }
        }
        fetchTemplates()
    }, [accessToken])

    // Polling for QR status
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeStep === 0 && qrCode && !isConnected) {
            interval = setInterval(async () => {
                try {
                    const status = await channelService.getChannelConfigStatus(accessToken)
                    if (status.isConnected) {
                        setIsConnected(true)
                        setQrCode(null)
                        setStatusMessage({ type: 'success', text: '✅ WhatsApp conectado correctamente.' })
                        setActiveStep(1)
                    } else if (status.qrCode && status.qrCode !== qrCode) {
                        setQrCode(status.qrCode)
                    }
                } catch (error) {
                    console.error('Polling error:', error)
                }
            }, 5000)
        }
        return () => clearInterval(interval)
    }, [qrCode, isConnected, activeStep, accessToken])

    const handleActivate = async () => {
        setLoading(true)
        setStatusMessage(null)
        try {
            const res = await channelService.activateWhatsAppChannel(accessToken)
            if (res.qrCode) {
                setQrCode(res.qrCode)
                setStatusMessage({ type: 'info', text: '📱 Escanea el código QR con tu WhatsApp.' })
            } else if (res.isConnected) {
                setIsConnected(true)
                setActiveStep(1)
            }
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'Error al activar la instancia.' })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveConfig = async () => {
        if (!selectedTemplateId) {
            setStatusMessage({ type: 'error', text: 'Debes seleccionar una especialidad para el agente.' })
            return
        }
        
        setLoading(true)
        try {
            // 1. Create or Update Tenant Agent Configuration
            const agentConfig = await agentService.personalize({
                globalAgentId: selectedTemplateId,
                displayName: displayName || 'Asistente IA',
                companySpecificContext: businessContext,
            }, accessToken)
            
            // 2. Create the generic channel record linked to this Agent
            await channelService.createChannel({
                name: businessName || 'WhatsApp Business',
                platform: 'WHATSAPP',
                provider: 'EVOLUTION_API',
                status: true,
                botIntegrationId: agentConfig.id // Link to personalized agent
            } as any, accessToken)

            onComplete()
        } catch (error) {
            setStatusMessage({ type: 'error', text: 'Error al guardar la configuración final.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ p: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 8 }}>
                {STEPS.map(label => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
            </Stepper>

            {statusMessage && (
                <Alert severity={statusMessage.type} sx={{ mb: 6 }} onClose={() => setStatusMessage(null)}>
                    {statusMessage.text}
                </Alert>
            )}

            {activeStep === 0 && (
                <Box sx={{ textAlign: 'center' }}>
                    {!qrCode && !isConnected ? (
                        <Box sx={{ py: 6 }}>
                            <Box sx={{ mb: 4, color: 'success.main' }}>
                                <i className='tabler-brand-whatsapp text-6xl' />
                            </Box>
                            <Typography variant='h5' sx={{ mb: 2 }}>Paso 1: Vincular WhatsApp</Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mb: 6 }}>
                                Genera un código QR para conectar la instancia de Evolution API a tu cuenta de CloudFly.
                            </Typography>
                            <Button 
                                variant='contained' 
                                onClick={handleActivate} 
                                disabled={loading} 
                                startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-qrcode' />}
                            >
                                {loading ? 'Activando...' : 'Generar QR de Activación'}
                            </Button>
                        </Box>
                    ) : (qrCode && !isConnected) ? (
                        <Box sx={{ py: 2 }}>
                            <Typography variant='h6' sx={{ mb: 4 }}>Escanea el Código QR</Typography>
                            <Box
                                component='img'
                                src={`data:image/png;base64,${qrCode}`}
                                sx={{ 
                                    width: 280, height: 280, p: 2, border: 1, borderColor: 'divider', 
                                    borderRadius: 2, bgcolor: 'white', mx: 'auto', boxShadow: 2 
                                }}
                            />
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 6 }}>
                                Escanea desde WhatsApp {'>'} Dispositivos vinculados {'>'} Vincular un dispositivo.
                            </Typography>
                            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                                <CircularProgress size={20} />
                                <Typography variant='caption' color='text.secondary'>Esperando conexión...</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ py: 8 }}>
                            <i className='tabler-circle-check text-6xl text-success mb-4' />
                            <Typography variant='h5'>¡WhatsApp Conectado!</Typography>
                            <Button variant='contained' sx={{ mt: 6 }} onClick={() => setActiveStep(1)}>
                                Personalizar Especialidad AI
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            {activeStep === 1 && (
                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <Typography variant='h6' sx={{ mb: 1 }}>Paso 2: Especialidad y Personalidad</Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
                            Elige una especialidad global y personalízala con los detalles de tu negocio.
                        </Typography>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <TextField 
                            fullWidth 
                            label='Nombre de la Empresa' 
                            value={businessName} 
                            onChange={e => setBusinessName(e.target.value)} 
                            placeholder='Ej: Óptica Santa Lucía' 
                            size='small'
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size='small'>
                            <InputLabel>Especialidad del Agente</InputLabel>
                            <Select
                                value={selectedTemplateId}
                                label='Especialidad del Agente'
                                onChange={e => setSelectedTemplateId(Number(e.target.value))}
                            >
                                {templates.map(tpl => (
                                    <MenuItem key={tpl.id} value={tpl.id}>
                                        <i className='tabler-robot mr-2 text-sm' /> {tpl.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField 
                            fullWidth 
                            label='Nombre Público del Agente' 
                            value={displayName} 
                            onChange={e => setDisplayName(e.target.value)} 
                            placeholder='Ej: Claudia' 
                            size='small'
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <TextField 
                            fullWidth 
                            multiline 
                            rows={4} 
                            label='Detalles de tu Negocio (Tu Contexto)' 
                            value={businessContext} 
                            onChange={e => setBusinessContext(e.target.value)} 
                            placeholder='Indica horarios, servicios, productos clave, precios, etc...' 
                        />
                        <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
                            Este contexto se sumará a las instrucciones expertas de la especialidad seleccionada.
                        </Typography>
                    </Grid>

                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button variant='outlined' color='secondary' onClick={() => setActiveStep(0)}>Atrás</Button>
                        <Button 
                            variant='contained' 
                            onClick={handleSaveConfig} 
                            disabled={loading || !selectedTemplateId}
                            startIcon={loading && <CircularProgress size={20} color='inherit' />}
                        >
                            {loading ? 'Guardando...' : 'Finalizar y Asignar Agente'}
                        </Button>
                    </Grid>
                </Grid>
            )}

            <Divider sx={{ my: 6 }} />
            <Box sx={{ textAlign: 'center' }}>
                <Button variant='text' color='secondary' onClick={onCancel} size='small'>Cancelar y salir</Button>
            </Box>
        </Box>
    )
}

export default WhatsAppSetupForm
