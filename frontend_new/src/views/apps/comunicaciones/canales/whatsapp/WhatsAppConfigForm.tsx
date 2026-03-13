'use client'

import { useState, useEffect } from 'react'
import { Box, Button, Typography, CircularProgress, Alert } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'

interface Props {
  onSuccess: () => void
  mode?: string
}

const WhatsAppConfigForm = ({ onSuccess }: Props) => {
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [instanceName, setInstanceName] = useState<string>('')

  useEffect(() => {
    const user = userMethods.getUserLogin()
    if (user && user.username) {
      setInstanceName(`cloudfly_${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`)
    }
  }, [])

  const handleStartConnection = async () => {
    try {
      setLoading(true)
      setStatus('generating')
      setError(null)

      // 1. Crear instancia
      await axiosInstance.post(`/api/evolution/instance/${instanceName}`)
      
      // 2. Obtener QR
      const qrResponse = await axiosInstance.get(`/api/evolution/qr/${instanceName}`)
      
      if (qrResponse.data && qrResponse.data.base64) {
        setQrCode(qrResponse.data.base64)
        setStatus('waiting')
      } else {
        throw new Error('No se pudo obtener el código QR')
      }
    } catch (err: any) {
      console.error('Error connecting WhatsApp:', err)
      setError(err.response?.data?.message || 'Error al conectar con Evolution API')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmScan = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get(`/api/evolution/status/${instanceName}`)
      
      // Según la documentación de Evolution API, el estado 'open' significa conectado
      if (res.data && res.data.instance && res.data.instance.state === 'open') {
        setStatus('connected')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setError('Aún no hemos detectado la conexión. Por favor asegúrate de haber escaneado el código.')
      }
    } catch (err) {
      setError('Error al validar el estado. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ mt: 4, textAlign: 'center', p: 4 }}>
      {status === 'idle' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Paso 2: Conecta tu WhatsApp
          </Typography>
          <Typography variant="body1" sx={{ mb: 6, color: 'text.secondary' }}>
            Para que tu Chatbot IA pueda responder por ti, necesitamos vincular tu número de WhatsApp.
          </Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleStartConnection}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <i className='tabler-brand-whatsapp' />}
          >
            Generar Código QR
          </Button>
          <Box sx={{ mt: 4 }}>
            <Button 
                variant="text" 
                color="secondary" 
                onClick={onSuccess}
                className="omit-chatbot-step"
            >
                Configurar más tarde
            </Button>
          </Box>
        </Box>
      )}

      {(status === 'generating' || loading) && status !== 'waiting' && (
        <Box sx={{ py: 10 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Iniciando servicio de mensajería...</Typography>
        </Box>
      )}

      {status === 'waiting' && qrCode && (
        <Box>
          <Typography variant="h6" gutterBottom>
            📱 Escanea el Código QR
          </Typography>
          <Typography variant="body2" sx={{ mb: 4 }}>
            Abre WhatsApp en tu teléfono {'>'} Dispositivos vinculados {'>'} Vincular un dispositivo
          </Typography>
          
          <Box sx={{ 
            bgcolor: 'white', 
            p: 2, 
            display: 'inline-block', 
            borderRadius: 2, 
            boxShadow: 3,
            mb: 4
          }}>
            <img 
              src={qrCode} 
              alt="WhatsApp QR Code" 
              className="whatsapp-qr-code" 
              style={{ width: 256, height: 256 }} 
            />
          </Box>

          {error && (
            <Alert severity="warning" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleConfirmScan}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              Ya escaneé el código
            </Button>
            <Button variant="outlined" onClick={handleStartConnection}>
              Regenerar QR
            </Button>
          </Box>
        </Box>
      )}

      {status === 'connected' && (
        <Box sx={{ py: 6 }}>
          <Box sx={{ color: 'success.main', fontSize: '4rem', mb: 2 }}>✓</Box>
          <Typography variant="h5" color="success.main" gutterBottom>
            ¡WhatsApp Conectado!
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Tu Chatbot IA está listo para entrar en acción.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Redirigiendo al siguiente paso...
          </Typography>
        </Box>
      )}

      {status === 'error' && error && !qrCode && (
        <Box>
           <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={handleStartConnection}>
                Reintentar
              </Button>
              <Button variant="text" color="secondary" onClick={onSuccess}>
                Configurar más tarde
              </Button>
            </Box>
        </Box>
      )}
    </Box>
  )
}

export default WhatsAppConfigForm
