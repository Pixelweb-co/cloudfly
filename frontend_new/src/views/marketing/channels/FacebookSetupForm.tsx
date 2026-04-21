'use client'

import { useState, useEffect } from 'react'
import { Box, Button, Typography, CircularProgress, Alert, List, ListItem, ListItemText, ListItemAvatar, Avatar, Radio, Divider } from '@mui/material'
import axios from 'axios'

interface Page {
    id: string
    name: string
    access_token: string
    category: string
    picture?: { data: { url: string } }
}

interface Props {
    accessToken: string
    onComplete: () => void
    onCancel: () => void
}

const FacebookSetupForm = ({ accessToken, onComplete, onCancel }: Props) => {
    const [step, setStep] = useState<1 | 2>(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pages, setPages] = useState<Page[]>([])
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
    const [userAccessToken, setUserAccessToken] = useState<string | null>(null)

    // Mock para simular el inicio de sesión con Facebook si no está el SDK cargado
    const handleFacebookLogin = async () => {
        setLoading(true)
        setError(null)
        
        try {
            // En una implementación real, aquí llamaríamos a window.FB.login()
            // y obtendríamos el shortLivedToken.
            const mockShortLivedToken = 'MOCK_FB_TOKEN_' + Math.random().toString(36).substring(7)
            
            // 1. Intercambiar por Long Lived Token
            const exchangeRes = await axios.post('/api/channels/facebook/exchange-token', 
                { shortLivedToken: mockShortLivedToken },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            )
            
            const longLivedToken = exchangeRes.data.accessToken
            setUserAccessToken(longLivedToken)
            
            // 2. Obtener páginas
            const pagesRes = await axios.get('/api/channels/facebook/pages', {
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    'X-FB-User-Token': longLivedToken
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
            console.error('FB Login Error:', err)
            setError('Error al conectar con Facebook. Verifica la configuración de tu aplicación Meta.')
        } finally {
            setLoading(false)
        }
    }

    const handleRegisterPage = async () => {
        if (!selectedPageId || !userAccessToken) return
        
        setLoading(true)
        const selectedPage = pages.find(p => p.id === selectedPageId)
        
        try {
            await axios.post('/api/channels/facebook/register', {
                pageId: selectedPage?.id,
                pageName: selectedPage?.name,
                pageAccessToken: selectedPage?.access_token,
                userAccessToken: userAccessToken
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            })
            
            onComplete()
        } catch (err) {
            setError('Error al registrar la página en el sistema.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ py: 4 }}>
            {step === 1 && (
                <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ mb: 6, display: 'flex', justifyContent: 'center' }}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: '#0084FF15', color: '#0084FF' }}>
                            <i className='tabler-brand-facebook text-5xl' />
                        </Avatar>
                    </Box>
                    <Typography variant='h5' sx={{ mb: 2, fontWeight: 600 }}>Conectar Facebook Messenger</Typography>
                    <Typography variant='body1' color='text.secondary' sx={{ mb: 8 }}>
                        Vincula tu Fan Page para recibir y responder mensajes directamente desde Cloudfly. 
                        Necesitarás iniciar sesión con tu cuenta de Facebook personal que administra las páginas.
                    </Typography>
                    
                    {error && <Alert severity='error' sx={{ mb: 4 }}>{error}</Alert>}
                    
                    <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <Button variant='outlined' color='secondary' onClick={onCancel} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button 
                            variant='contained' 
                            sx={{ bgcolor: '#1877F2', '&:hover': { bgcolor: '#166fe5' } }}
                            onClick={handleFacebookLogin}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='tabler-brand-facebook' />}
                        >
                            Continuar con Facebook
                        </Button>
                    </Box>
                </Box>
            )}

            {step === 2 && (
                <Box>
                    <Typography variant='h6' sx={{ mb: 4, fontWeight: 600 }}>Selecciona la Página a Vincular</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
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

                    <Box sx={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <Button variant='outlined' color='secondary' onClick={() => setStep(1)} disabled={loading}>
                            Atrás
                        </Button>
                        <Button 
                            variant='contained' 
                            onClick={handleRegisterPage}
                            disabled={loading || !selectedPageId}
                            startIcon={loading && <CircularProgress size={20} color='inherit' />}
                        >
                            Confirmar y Vincular
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    )
}

export default FacebookSetupForm
