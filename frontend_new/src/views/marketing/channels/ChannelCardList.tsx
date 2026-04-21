'use client'

import { Grid, Card, CardContent, Typography, Box, Button, Chip, IconButton, Alert } from '@mui/material'
import type { Channel } from '@/types/marketing'

export interface PlatformInfo {
    title: string
    icon: string
    color: string
    platform: string
    provider: string
    description: string
    disabled?: boolean
}

export const AVAILABLE_PLATFORMS: PlatformInfo[] = [
    {
        title: 'WhatsApp Evolution',
        icon: 'tabler-brand-whatsapp',
        color: '#25D366',
        platform: 'WHATSAPP',
        provider: 'EVOLUTION_API',
        description: 'Vincular por QR usando Evolution API (No Oficial)'
    },
    {
        title: 'WhatsApp Oficial',
        icon: 'tabler-brand-whatsapp',
        color: '#25D366',
        platform: 'WHATSAPP_OFFICIAL',
        provider: 'META_API',
        description: 'Conecta vía Meta Business API Cloud',
        disabled: true
    },
    {
        title: 'Facebook Messenger',
        icon: 'tabler-brand-facebook',
        color: '#0084FF',
        platform: 'FACEBOOK',
        provider: 'META_API',
        description: 'Integrar mensajes de tu Fan Page'
    },
    {
        title: 'Instagram',
        icon: 'tabler-brand-instagram',
        color: '#E4405F',
        platform: 'INSTAGRAM',
        provider: 'META_API',
        description: 'DMs de Instagram Direct',
        disabled: true
    },
    {
        title: 'TikTok Business',
        icon: 'tabler-brand-tiktok',
        color: '#000000',
        platform: 'TIKTOK',
        provider: 'TIKTOK_API',
        description: 'Canal de TikTok Business',
        disabled: true
    },
    {
        title: 'Telegram',
        icon: 'tabler-brand-send',
        color: '#0088CC',
        platform: 'TELEGRAM',
        provider: 'TELEGRAM_API',
        description: 'Bots de Telegram',
        disabled: true
    }
]

interface Props {
    channels: Channel[]
    onActivate: (platform: PlatformInfo) => void
    onManage: (channel: Channel) => void
    onDelete: (channel: Channel) => void
}

const ChannelCardList = ({ channels, onActivate, onManage, onDelete }: Props) => {
    
    const getChannelForPlatform = (platform: string, provider: string) => {
        return channels.find(c => c.platform === platform && c.provider === provider)
    }

    return (
        <Grid container spacing={6}>
            {AVAILABLE_PLATFORMS.map(platform => {
                const channel = getChannelForPlatform(platform.platform, platform.provider)
                const isConnected = !!channel

                return (
                    <Grid item xs={12} sm={6} md={4} key={`${platform.platform}-${platform.provider}`}>
                        <Card 
                            sx={{ 
                                height: '100%', 
                                position: 'relative', 
                                border: isConnected ? 2 : 1, 
                                borderColor: isConnected ? 'primary.main' : 'divider',
                                opacity: platform.disabled ? 0.7 : 1,
                                transition: 'all 0.2s',
                                '&:hover': platform.disabled ? {} : { boxShadow: 4 }
                            }}
                        >
                            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 48,
                                            height: 48,
                                            borderRadius: 1,
                                            backgroundColor: `${platform.color}15`,
                                            color: platform.color
                                        }}
                                    >
                                        <i className={`${platform.icon} text-3xl`} />
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        {platform.disabled ? (
                                            <Chip label='Próximamente' size='small' variant='tonal' color='secondary' />
                                        ) : isConnected ? (
                                            <Chip label='Activo' color='success' variant='tonal' size='small' />
                                        ) : (
                                            <Chip label='No conectado' variant='tonal' size='small' />
                                        )}
                                    </Box>
                                </Box>

                                <Typography variant='h5' sx={{ mb: 2, fontWeight: 600 }}>
                                    {platform.title}
                                </Typography>
                                <Typography variant='body2' color='text.secondary' sx={{ mb: 4, flexGrow: 1 }}>
                                    {platform.description}
                                </Typography>

                                <Box sx={{ mt: 'auto' }}>
                                    {isConnected ? (
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button 
                                                fullWidth 
                                                variant='outlined' 
                                                size='small' 
                                                onClick={() => onManage(channel!)}
                                                startIcon={<i className='tabler-settings' />}
                                            >
                                                Gestionar
                                            </Button>
                                            <IconButton color='error' size='small' onClick={() => onDelete(channel!)}>
                                                <i className='tabler-trash' />
                                            </IconButton>
                                        </Box>
                                    ) : (
                                        <Button 
                                            fullWidth 
                                            variant='contained' 
                                            size='small' 
                                            disabled={platform.disabled}
                                            onClick={() => onActivate(platform)}
                                            startIcon={<i className='tabler-plus' />}
                                        >
                                            Activar
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )
            })}
        </Grid>
    )
}

export default ChannelCardList
