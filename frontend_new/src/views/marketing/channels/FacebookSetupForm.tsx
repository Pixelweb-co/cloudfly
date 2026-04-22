import React, { useState, useEffect } from 'react'
import { 
    Button, 
    Typography, 
    Box, 
    Stepper, 
    Step, 
    StepLabel, 
    CircularProgress, 
    Alert,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Radio,
    Divider
} from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'

interface Page {
    id: string
    name: string
    access_token: string
    category: string
    picture?: {
        data: {
            url: string
        }
    }
}

interface FacebookSetupFormProps {
    accessToken: string
    onComplete: () => void
}

declare global {
    interface Window {
        FB: any
        fbAsyncInit: () => void
    }
}

const FacebookSetupForm: React.FC<FacebookSetupFormProps> = ({ accessToken, onComplete }) => {
    const [activeStep, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pages, setPages] = useState<Page[]>([])
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
    const [longLivedToken, setLongLivedToken] = useState<string | null>(null)
    const [fbAppId, setFbAppId] = useState<string | null>(null)

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await axiosInstance.get('/api/channels/facebook/config')
                setFbAppId(res.data.appId)
            } catch (err) {
                console.error('Error fetching FB config:', err)
            }
        }
        fetchConfig()
    }, [])

    useEffect(() => {
        if (!fbAppId) return

        if (!document.getElementById('facebook-jssdk')) {
            const script = document.createElement('script')
            script.id = 'facebook-jssdk'
            script.src = "https://connect.facebook.net/en_US/sdk.js"
            script.async = true
            script.defer = true
            document.body.appendChild(script)

            window.fbAsyncInit = function() {
                window.FB.init({
                    appId: fbAppId,
                    cookie: true,
                    xfbml: true,
                    version: 'v19.0'
                })
            }
        }
    }, [fbAppId])

    const handleFacebookLogin = async () => {
        if (!window.FB) {
            setError('El SDK de Facebook no se ha cargado correctamente.')
            return
        }

        setLoading(true)
        setError(null)
        
        window.FB.login((response: any) => {
            if (response.authResponse) {
                const shortLivedToken = response.authResponse.accessToken
                exchangeToken(shortLivedToken)
            } else {
                setLoading(false)
                setError('El usuario canceló el inicio de sesión o no autorizó la aplicación.')
            }
        }, { 
            scope: 'pages_messaging,pages_show_list,pages_manage_metadata,public_profile',
            return_scopes: true 
        })
    }

    const exchangeToken = async (shortLivedToken: string) => {
        try {
            const res = await axiosInstance.post('/api/channels/facebook/exchange-token', {
                shortLivedToken
            })
            
            const longToken = res.data.accessToken
            setLongLivedToken(longToken)
            
            // Cargar páginas
            const pagesRes = await axiosInstance.get('/api/channels/facebook/pages', {
                headers: { 
                    'X-FB-User-Token': longToken
                }
            })
            
            if (pagesRes.data && Array.isArray(pagesRes.data)) {
                setPages(pagesRes.data)
            } else {
                setPages([])
                setError('No se encontraron páginas vinculadas a esta cuenta de Facebook.')
            }
            setStep(2)
        } catch (err: any) {
            console.error('FB Exchange Error:', err)
            setError('Error al procesar la autenticación con Facebook.')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!selectedPageId || !longLivedToken) return
        
        setLoading(true)
        setError(null)
        
        const selectedPage = pages.find(p => p.id === selectedPageId)
        
        try {
            await axiosInstance.post('/api/channels/facebook/register', {
                pageId: selectedPageId,
                pageName: selectedPage?.name,
                pageAccessToken: selectedPage?.access_token,
                userAccessToken: longLivedToken
            })
            
            onComplete()
        } catch (err: any) {
            setError('Error al vincular la página de Facebook.')
            setLoading(false)
        }
    }

    const steps = ['Autenticación', 'Cargar Páginas', 'Vincular']

    return (
        <Box sx={{ width: '100%', py: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant='h6' sx={{ mb: 2 }}>
                        Conecta tu cuenta de Facebook
                    </Typography>
                    <Typography variant='body2' sx={{ mb: 6, color: 'text.secondary' }}>
                        Necesitamos permisos para gestionar tus mensajes y ver tus páginas.
                    </Typography>
                    {error && <Alert severity='error' sx={{ mb: 4 }}>{error}</Alert>}
                    <Button 
                        variant='contained' 
                        startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-brand-facebook' />}
                        onClick={handleFacebookLogin}
                        disabled={loading}
                        sx={{ bgcolor: '#1877F2', '&:hover': { bgcolor: '#166fe5' } }}
                    >
                        {loading ? 'Cargando...' : 'Iniciar Sesión con Facebook'}
                    </Button>
                </Box>
            )}

            {activeStep === 2 && (
                <Box>
                    <Typography variant='h6' sx={{ mb: 2 }}>
                        Selecciona la Página a Vincular
                    </Typography>
                    <Typography variant='body2' sx={{ mb: 4, color: 'text.secondary' }}>
                        Estas son las páginas que administras. Selecciona una para integrarla con el ERP.
                    </Typography>
                    
                    {error && <Alert severity='error' sx={{ mb: 4 }}>{error}</Alert>}

                    <List sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 6, maxHeight: 300, overflow: 'auto' }}>
                        {pages && Array.isArray(pages) && pages.length > 0 ? (
                            pages.map((page) => (
                                <ListItem 
                                    key={page.id}
                                    secondaryAction={
                                        <Radio
                                            checked={selectedPageId === page.id}
                                            onChange={() => setSelectedPageId(page.id)}
                                            value={page.id}
                                        />
                                    }
                                    sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                                    onClick={() => setSelectedPageId(page.id)}
                                >
                                    <ListItemAvatar>
                                        <Avatar src={page.picture?.data?.url}>
                                            <i className='tabler-brand-facebook' />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={page.name} 
                                        secondary={page.category} 
                                    />
                                </ListItem>
                            ))
                        ) : (
                            <ListItem>
                                <ListItemText primary="No se encontraron páginas disponibles" />
                            </ListItem>
                        )}
                    </List>

                    <Divider sx={{ mb: 6 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button onClick={() => setStep(0)} disabled={loading}>
                            Atrás
                        </Button>
                        <Button 
                            variant='contained' 
                            onClick={handleConfirm}
                            disabled={!selectedPageId || loading}
                        >
                            {loading ? <CircularProgress size={20} color='inherit' /> : 'Confirmar y Vincular'}
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    )
}

export default FacebookSetupForm
