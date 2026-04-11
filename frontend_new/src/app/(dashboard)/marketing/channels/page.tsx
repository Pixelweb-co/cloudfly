'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { channelService } from '@/services/marketing/channelService'
import type { Channel } from '@/types/marketing'
import ChannelCardList, { PlatformInfo } from '@/views/marketing/channels/ChannelCardList'
import WhatsAppActivationDialog from '@/views/marketing/channels/WhatsAppActivationDialog'
import { Grid, Typography, Box, CircularProgress, Alert, Button } from '@mui/material'

const ChannelPage = () => {
    const { data: session, status } = useSession()
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // State for Activation Dialogs
    const [activePlatform, setActivePlatform] = useState<PlatformInfo | null>(null)
    const [openWhatsAppDialog, setOpenWhatsAppDialog] = useState(false)

    const fetchChannels = async () => {
        try {
            setLoading(true)
            const data = await channelService.getChannels()
            setChannels(data)
            setError(null)
        } catch (error) {
            console.error('Error fetching channels:', error)
            setError('No se pudieron cargar los canales.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        } else if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.accessToken)) {
            setLoading(false)
        }
    }, [session, status])

    const handleActivate = (platform: PlatformInfo) => {
        if (platform.platform === 'WHATSAPP' && platform.provider === 'EVOLUTION_API') {
            setOpenWhatsAppDialog(true)
        } else {
            // Future platforms logic here (Facebook, etc.)
            console.log('Activating', platform.platform)
        }
    }

    const handleDelete = async (channel: Channel) => {
        if (!window.confirm(`¿Estás seguro de eliminar el canal ${channel.name}?`)) return
        
        try {
            await channelService.deleteChannel(channel.id, (session?.user as any).accessToken)
            await fetchChannels()
        } catch (error) {
            console.error('Error deleting channel:', error)
            alert('Error al eliminar el canal')
        }
    }

    if (loading && channels.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box>
            <Grid container spacing={6}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant='h4' sx={{ mb: 1, fontWeight: 600 }}>Canales de Comunicación</Typography>
                        <Typography variant='body2' color='text.secondary'>
                            Gestiona tus integraciones y automatiza tus respuestas con IA en múltiples plataformas.
                        </Typography>
                    </Box>
                    <Button 
                        variant='tonal' 
                        size='small' 
                        onClick={fetchChannels}
                        startIcon={<i className='tabler-refresh' />}
                    >
                        Actualizar
                    </Button>
                </Grid>

                {error && (
                    <Grid item xs={12}>
                        <Alert severity='error'>{error}</Alert>
                    </Grid>
                )}

                <Grid item xs={12}>
                    <ChannelCardList
                        channels={channels}
                        onActivate={handleActivate}
                        onManage={(channel) => console.log('Manage', channel)}
                        onDelete={handleDelete}
                    />
                </Grid>
            </Grid>

            {/* Dialogs */}
            {session?.user?.accessToken && (
                <WhatsAppActivationDialog 
                    open={openWhatsAppDialog}
                    onClose={() => setOpenWhatsAppDialog(false)}
                    onComplete={fetchChannels}
                />
            )}
        </Box>
    )
}

export default ChannelPage
