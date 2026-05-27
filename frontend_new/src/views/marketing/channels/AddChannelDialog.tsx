'use client'

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, Card, CardContent, Typography, Box } from '@mui/material'

const availablePlatforms = [
    { title: 'WhatsApp', icon: 'tabler-brand-whatsapp', color: '#25D366', platform: 'WHATSAPP', description: 'Conecta tu número oficial o Evolution API' },
    { title: 'Facebook', icon: 'tabler-brand-facebook', color: '#0084FF', platform: 'FACEBOOK', description: 'Mensajes de Messenger', disabled: true },
    { title: 'Instagram', icon: 'tabler-brand-instagram', color: '#E4405F', platform: 'INSTAGRAM', description: 'DMs de Instagram Direct', disabled: true },
    { title: 'TikTok', icon: 'tabler-brand-tiktok', color: '#000000', platform: 'TIKTOK', description: 'Canal de TikTok Business', disabled: true }
]

interface Props {
    open: boolean
    onClose: () => void
    onSelect: (platform: string) => void
}

const AddChannelDialog = ({ open, onClose, onSelect }: Props) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle sx={{ textAlign: 'center', pt: 8 }}>
                <Typography variant='h4' sx={{ mb: 2 }}>Selecciona un Canal</Typography>
                <Typography variant='body2' color='text.secondary'>Elige la plataforma que deseas integrar a CloudFly</Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 8, pb: 8 }}>
                <Grid container spacing={4} sx={{ mt: 2 }}>
                    {availablePlatforms.map(platform => (
                        <Grid item xs={12} sm={6} key={platform.platform}>
                            <Card
                                onClick={() => !platform.disabled && onSelect(platform.platform)}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    cursor: platform.disabled ? 'not-allowed' : 'pointer',
                                    opacity: platform.disabled ? 0.6 : 1,
                                    transition: 'all 0.2s',
                                    '&:hover': platform.disabled ? {} : { borderColor: platform.color, backgroundColor: `${platform.color}08`, transform: 'scale(1.02)' }
                                }}
                            >
                                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                                    <Box
                                        sx={{
                                            mx: 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 48,
                                            height: 48,
                                            borderRadius: 1,
                                            backgroundColor: `${platform.color}15`,
                                            color: platform.color,
                                            mb: 3
                                        }}
                                    >
                                        <i className={`${platform.icon} text-3xl`} />
                                    </Box>
                                    <Typography variant='h6' sx={{ mb: 1, fontWeight: 600 }}>{platform.title}</Typography>
                                    <Typography variant='caption' color='text.secondary'>{platform.disabled ? 'Próximamente' : platform.description}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 8 }}>
                <Button variant='outlined' color='secondary' onClick={onClose}>Cancelar</Button>
            </DialogActions>
        </Dialog>
    )
}

export default AddChannelDialog
