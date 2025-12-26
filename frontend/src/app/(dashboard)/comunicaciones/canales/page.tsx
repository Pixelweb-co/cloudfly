'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip
} from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import type { Channel, ChannelDTO, AvailableChannel } from '@/types/channels'
import {
    Add as AddIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Settings as SettingsIcon,
    PowerSettingsNew as PowerIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon
} from '@mui/icons-material'

const AVAILABLE_CHANNELS: AvailableChannel[] = [
    {
        type: 'whatsapp' as const,
        name: 'WhatsApp Business',
        icon: '💬',
        color: '#25D366',
        description: 'Conecta tu WhatsApp Business para atención automatizada 24/7'
    },
    {
        type: 'facebook' as const,
        name: 'Facebook Messenger',
        icon: '💙',
        color: '#0084FF',
        description: 'Responde mensajes de tu página de Facebook automáticamente'
    },
    {
        type: 'instagram' as const,
        name: 'Instagram Direct',
        icon: '📸',
        color: '#E4405F',
        description: 'Gestiona mensajes directos de Instagram con IA'
    },
    {
        type: 'tiktok' as const,
        name: 'TikTok Business',
        icon: '🎵',
        color: '#000000',
        description: 'Automatiza respuestas en tu cuenta de TikTok Business'
    }
]

const ChannelsPage = () => {
    const router = useRouter()
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)
    const [openAddDialog, setOpenAddDialog] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        loadChannels()
    }, [])

    const loadChannels = async (): Promise<void> => {
        try {
            setLoading(true)
            const response = await axiosInstance.get<ChannelDTO[]>('/api/channels')

            const mappedChannels: Channel[] = response.data.map((ch: ChannelDTO) => ({
                id: ch.id.toString(),
                type: ch.type.toLowerCase() as Channel['type'],
                name: ch.name,
                isActive: ch.isActive,
                isConnected: ch.isConnected,
                phoneNumber: ch.phoneNumber,
                pageId: ch.pageId,
                username: ch.username,
                lastSync: ch.lastSync,
                icon: AVAILABLE_CHANNELS.find(ac => ac.type === ch.type.toLowerCase())?.icon || '📡',
                color: AVAILABLE_CHANNELS.find(ac => ac.type === ch.type.toLowerCase())?.color || '#000000',
                description: AVAILABLE_CHANNELS.find(ac => ac.type === ch.type.toLowerCase())?.description || ''
            }))

            setChannels(mappedChannels)
        } catch (error) {
            console.error('Error loading channels:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (channelId: string): Promise<void> => {
        try {
            await axiosInstance.patch(`/api/channels/${channelId}/toggle`)

            setChannels(prev =>
                prev.map(ch =>
                    ch.id === channelId ? { ...ch, isActive: !ch.isActive } : ch
                )
            )
        } catch (error) {
            console.error('Error toggling channel:', error)
        }
    }

    const handleDeleteClick = (channel: Channel): void => {
        setChannelToDelete(channel)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async (): Promise<void> => {
        if (!channelToDelete) return

        try {
            setDeleting(true)

            // Si es WhatsApp, primero eliminar la instancia de Evolution API
            if (channelToDelete.type === 'whatsapp') {
                try {
                    await axiosInstance.delete('/api/chatbot/instance')
                    console.log('Evolution API instance deleted')
                } catch (error) {
                    console.error('Error deleting Evolution API instance:', error)
                }
            }

            // Eliminar el canal
            await axiosInstance.delete(`/api/channels/${channelToDelete.id}`)

            // Actualizar lista
            setChannels(prev => prev.filter(ch => ch.id !== channelToDelete.id))

            setDeleteDialogOpen(false)
            setChannelToDelete(null)
        } catch (error) {
            console.error('Error deleting channel:', error)
        } finally {
            setDeleting(false)
        }
    }

    const handleAddChannel = (type: string): void => {
        router.push(`/comunicaciones/canales/configurar/${type}`)
        setOpenAddDialog(false)
    }

    const getAvailableChannelsToAdd = (): AvailableChannel[] => {
        const existingTypes = channels.map(ch => ch.type)
        return AVAILABLE_CHANNELS.filter(ch => !existingTypes.includes(ch.type))
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress size={60} />
            </Box>
        )
    }

    const availableToAdd = getAvailableChannelsToAdd()

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            📡 Canales de Comunicación
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Gestiona tus canales de atención al cliente y automatiza respuestas con IA
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<RefreshIcon />}
                        onClick={loadChannels}
                        size="large"
                    >
                        Actualizar
                    </Button>
                </Box>

                {channels.length === 0 && (
                    <Alert severity="info" icon="🚀" sx={{ mb: 3 }}>
                        <Typography variant="body1" fontWeight="600">
                            ¡Comienza a automatizar tu atención al cliente!
                        </Typography>
                        <Typography variant="body2">
                            Conecta tu primer canal de comunicación y deja que la IA responda a tus clientes 24/7
                        </Typography>
                    </Alert>
                )}
            </Box>

            {/* Channels Grid */}
            <Grid container spacing={3}>
                {/* Active Channels */}
                {channels.map((channel) => (
                    <Grid item xs={12} sm={6} md={4} key={channel.id}>
                        <Card
                            sx={{
                                height: '100%',
                                position: 'relative',
                                border: 2,
                                borderColor: channel.isConnected ? channel.color : 'divider',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                }
                            }}
                        >
                            {/* Status Badge */}
                            <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
                                <Chip
                                    icon={channel.isConnected ? <CheckCircleIcon /> : <CancelIcon />}
                                    label={channel.isConnected ? 'Conectado' : 'Desconectado'}
                                    color={channel.isConnected ? 'success' : 'error'}
                                    size="small"
                                />
                            </Box>

                            <CardContent sx={{ pt: 3 }}>
                                {/* Channel Icon */}
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: `${channel.color}15`,
                                        mb: 2,
                                        fontSize: '2.5rem'
                                    }}
                                >
                                    {channel.icon}
                                </Box>

                                {/* Channel Info */}
                                <Typography variant="h6" fontWeight="700" gutterBottom>
                                    {channel.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                    {channel.description}
                                </Typography>

                                {/* Connection Details */}
                                {channel.phoneNumber && (
                                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Número conectado
                                        </Typography>
                                        <Typography variant="body2" fontWeight="600">
                                            {channel.phoneNumber}
                                        </Typography>
                                    </Box>
                                )}

                                {channel.lastSync && (
                                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                        Última sincronización: {new Date(channel.lastSync).toLocaleString('es-ES')}
                                    </Typography>
                                )}

                                {/* Actions */}
                                <Box display="flex" flexDirection="column" gap={1} mt={2}>
                                    <Box display="flex" gap={1}>
                                        <Tooltip title={channel.isActive ? 'Desactivar canal' : 'Activar canal'}>
                                            <Button
                                                variant={channel.isActive ? 'outlined' : 'contained'}
                                                color={channel.isActive ? 'error' : 'success'}
                                                startIcon={<PowerIcon />}
                                                onClick={() => handleToggleActive(channel.id)}
                                                fullWidth
                                                size="small"
                                            >
                                                {channel.isActive ? 'Desactivar' : 'Activar'}
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="Configurar canal">
                                            <IconButton
                                                color="primary"
                                                sx={{ border: 1, borderColor: 'divider' }}
                                                onClick={() => router.push(`/comunicaciones/canales/configurar/${channel.type}`)}
                                            >
                                                <SettingsIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Tooltip title="Eliminar canal">
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => handleDeleteClick(channel)}
                                            fullWidth
                                            size="small"
                                        >
                                            Eliminar
                                        </Button>
                                    </Tooltip>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* Add Channel Card */}
                {availableToAdd.length > 0 && (
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            sx={{
                                height: '100%',
                                border: 2,
                                borderColor: 'divider',
                                borderStyle: 'dashed',
                                bgcolor: 'action.hover',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'primary.lighter',
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                }
                            }}
                            onClick={() => setOpenAddDialog(true)}
                        >
                            <CardContent
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    minHeight: 340
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        mb: 2,
                                        fontSize: '2.5rem'
                                    }}
                                >
                                    <AddIcon fontSize="large" />
                                </Box>
                                <Typography variant="h6" fontWeight="700" gutterBottom>
                                    Agregar Canal
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Conecta un nuevo canal de comunicación para automatizar tus respuestas
                                </Typography>
                                <Typography variant="caption" color="primary" sx={{ mt: 2, fontWeight: 600 }}>
                                    {availableToAdd.length} {availableToAdd.length === 1 ? 'canal disponible' : 'canales disponibles'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>

            {/* Add Channel Dialog */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h5" fontWeight="700">
                        🚀 Selecciona un Canal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Elige qué canal de comunicación deseas configurar
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        {availableToAdd.map((channel) => (
                            <Grid item xs={12} key={channel.type}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        border: 2,
                                        borderColor: 'divider',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            borderColor: channel.color,
                                            bgcolor: `${channel.color}08`,
                                            transform: 'scale(1.02)'
                                        }
                                    }}
                                    onClick={() => handleAddChannel(channel.type)}
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Box
                                                sx={{
                                                    width: 60,
                                                    height: 60,
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: `${channel.color}15`,
                                                    fontSize: '2rem'
                                                }}
                                            >
                                                {channel.icon}
                                            </Box>
                                            <Box flex={1}>
                                                <Typography variant="h6" fontWeight="600" gutterBottom>
                                                    {channel.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {channel.description}
                                                </Typography>
                                            </Box>
                                            <AddIcon color="primary" />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddDialog(false)}>Cancelar</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => !deleting && setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Typography variant="h5" fontWeight="700" color="error">
                        ⚠️ Eliminar Canal
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="600" gutterBottom>
                            Esta acción no se puede deshacer
                        </Typography>
                        {channelToDelete?.type === 'whatsapp' && (
                            <Typography variant="body2">
                                Al eliminar este canal de WhatsApp también se eliminará la conexión y toda su configuración.
                            </Typography>
                        )}
                    </Alert>

                    {channelToDelete && (
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Canal a eliminar:
                            </Typography>
                            <Typography variant="body1" fontWeight="600">
                                {channelToDelete.icon} {channelToDelete.name}
                            </Typography>
                            {channelToDelete.phoneNumber && (
                                <Typography variant="body2" color="text.secondary">
                                    {channelToDelete.phoneNumber}
                                </Typography>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                    >
                        {deleting ? 'Eliminando...' : 'Eliminar Canal'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ChannelsPage
