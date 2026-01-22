'use client'

import React, { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, IconButton, Button, Grid, Slider, Stack, Tooltip, Dialog, DialogContent, Divider } from '@mui/material'
import { styled, alpha } from '@mui/material/styles'
import { sipService } from '@/services/telefonia/sipService'

// Estilos personalizados para un look premium
const PhoneContainer = styled(Card)(({ theme }) => ({
    maxWidth: 350,
    margin: '0 auto',
    borderRadius: 24,
    background: theme.palette.mode === 'light'
        ? `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.grey[100], 0.8)})`
        : `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.grey[900], 0.8)})`,
    boxShadow: theme.shadows[10],
    overflow: 'hidden',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
}))

const DisplayArea = styled(Box)(({ theme }) => ({
    padding: theme.spacing(6, 4),
    textAlign: 'center',
    background: alpha(theme.palette.primary.main, 0.05),
    borderRadius: '0 0 24px 24px',
    marginBottom: theme.spacing(4)
}))

const DialButton = styled(IconButton)(({ theme }) => ({
    width: 64,
    height: 64,
    fontSize: '1.25rem',
    fontWeight: 600,
    borderRadius: '50%',
    backgroundColor: alpha(theme.palette.action.active, 0.05),
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        transform: 'scale(1.05)'
    },
    '&:active': {
        transform: 'scale(0.95)'
    }
}))

const CallActionButton = styled(IconButton, {
    shouldForwardProp: (prop) => prop !== 'colorType'
})<{ colorType?: 'success' | 'error' }>(({ theme, colorType }) => ({
    width: 72,
    height: 72,
    backgroundColor: colorType === 'success' ? theme.palette.success.main : theme.palette.error.main,
    color: '#fff',
    '&:hover': {
        backgroundColor: colorType === 'success' ? theme.palette.success.dark : theme.palette.error.dark,
        boxShadow: `0 0 15px ${alpha(colorType === 'success' ? theme.palette.success.main : theme.palette.error.main, 0.5)}`
    }
}))

const StatusBullet = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isOnline'
})<{ isOnline?: boolean }>(({ theme, isOnline }) => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: isOnline ? theme.palette.success.main : theme.palette.error.main,
    display: 'inline-block',
    marginRight: theme.spacing(2),
    boxShadow: `0 0 8px ${alpha(isOnline ? theme.palette.success.main : theme.palette.error.main, 0.6)}`,
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'pulse 2s infinite',
        backgroundColor: isOnline ? theme.palette.success.main : theme.palette.error.main,
        opacity: 0,
    },
    '@keyframes pulse': {
        '0%': { transform: 'scale(1)', opacity: 0.8 },
        '70%': { transform: 'scale(2.5)', opacity: 0 },
        '100%': { transform: 'scale(2.5)', opacity: 0 },
    }
}))

const WebPhone = () => {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isMuted, setIsMuted] = useState(false)
    const [inCall, setInCall] = useState(false)
    const [isRinging, setIsRinging] = useState(false)
    const [incomingCall, setIncomingCall] = useState<any>(null)
    const [volume, setVolume] = useState(80)
    const [isOnline, setIsOnline] = useState(false)
    const [callTimer, setCallTimer] = useState(0)

    // Audio de ringtone
    const ringtoneRef = React.useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Inicializar audio
        ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3')
        ringtoneRef.current.loop = true

        const initSip = async () => {
            try {
                // Configuración para desarrollo según requerimiento
                const config = {
                    extension: '2500',
                    password: 'cloudfly2025',
                    websocketUrl: 'ws://192.168.255.6:8088/ws', // VPN IP
                    domain: '192.168.255.6' // VPN IP
                }

                sipService.delegate = {
                    onRegistered: () => setIsOnline(true),
                    onUnregistered: () => setIsOnline(false),
                    onIncomingCall: (session) => {
                        console.log("🔔 Incoming Call in UI");
                        setIsRinging(true);
                        setIncomingCall(session);
                        ringtoneRef.current?.play();
                        setPhoneNumber(session.remoteIdentity.uri.user);
                    },
                    onCallEnded: () => {
                        setIsRinging(false);
                        setInCall(false);
                        setIncomingCall(null);
                        ringtoneRef.current?.pause();
                        if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
                    }
                }

                await sipService.initialize(config);
            } catch (error) {
                console.error("Error al inicializar SIP:", error);
                setIsOnline(false);
            }
        };

        initSip();

        return () => {
            sipService.disconnect();
            ringtoneRef.current?.pause();
        };
    }, []);

    // Timer para llamadas activas
    useEffect(() => {
        let interval: any;
        if (inCall) {
            interval = setInterval(() => {
                setCallTimer(prev => prev + 1);
            }, 1000);
        } else {
            setCallTimer(0);
        }
        return () => clearInterval(interval);
    }, [inCall]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    const handleDigitClick = (digit: string) => {
        if (phoneNumber.length < 15) {
            setPhoneNumber(prev => prev + digit)
        }
    }

    const handleBackspace = () => {
        setPhoneNumber(prev => prev.slice(0, -1))
    }

    const toggleCall = async () => {
        if (isRinging && incomingCall) {
            // Contestar llamada entrante
            await incomingCall.accept();
            setIsRinging(false);
            setInCall(true);
            ringtoneRef.current?.pause();
        } else if (!inCall) {
            if (phoneNumber) {
                try {
                    await sipService.call(phoneNumber);
                    setInCall(true);
                } catch (error) {
                    console.error("Error al realizar llamada:", error);
                }
            }
        } else {
            await sipService.hangup();
            setIsRinging(false);
            setInCall(false);
            ringtoneRef.current?.pause();
        }
    }

    const sanitizeHost = (host: string | undefined) => {
        if (!host || host.includes('172.23.') || host.includes('127.0.0.1')) return '192.168.255.6';
        return host;
    };

    // Audio Effect para asegurar reproducción
    useEffect(() => {
        if (isRinging) {
            const playAudio = async () => {
                try {
                    if (ringtoneRef.current) {
                        ringtoneRef.current.currentTime = 0;
                        await ringtoneRef.current.play();
                    }
                } catch (err) {
                    console.error("Error reproduciendo ringtone (posible bloqueo de navegador):", err);
                }
            };
            playAudio();
        } else {
            ringtoneRef.current?.pause();
            if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
        }
    }, [isRinging]);

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

    return (
        <PhoneContainer>
            {/* Modal de Llamada Entrante */}
            <Dialog
                open={isRinging}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: 24,
                        padding: 16,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)'
                    }
                }}
            >
                <DialogContent sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 4 }}>
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '50%',
                            animation: 'ripple 1.5s infinite ease-out',
                            border: '4px solid #4CAF50',
                            '@keyframes ripple': {
                                '0%': { transform: 'scale(1)', opacity: 1 },
                                '100%': { transform: 'scale(2)', opacity: 0 }
                            }
                        }} />
                        <Card sx={{
                            width: 100,
                            height: 100,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'success.main',
                            color: 'white',
                            position: 'relative',
                            zIndex: 2,
                            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)'
                        }}>
                            <i className="tabler-phone-call" style={{ fontSize: '3rem' }} />
                        </Card>
                    </Box>

                    <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold', letterSpacing: 1.5 }}>
                        Llamada entrante
                    </Typography>
                    <Typography variant="h3" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
                        {incomingCall?.remoteIdentity.uri.user.toString().replace('webrtc_', '')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                        {incomingCall?.remoteIdentity.uri.user}@{sanitizeHost(incomingCall?.remoteIdentity.uri.host)}
                    </Typography>
                    <Divider sx={{ my: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                            DESTINO
                        </Typography>
                    </Divider>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {incomingCall?.localIdentity.uri.user}@{sanitizeHost(incomingCall?.localIdentity.uri.host)}
                    </Typography>

                    <Stack direction="row" spacing={4} justifyContent="center">
                        <Button
                            variant="contained"
                            color="error"
                            size="large"
                            onClick={async () => {
                                await sipService.hangup();
                                setIsRinging(false);
                            }}
                            sx={{ borderRadius: 50, px: 4, py: 1.5 }}
                            startIcon={<i className="tabler-phone-off" />}
                        >
                            Rechazar
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={toggleCall}
                            sx={{ borderRadius: 50, px: 4, py: 1.5, boxShadow: '0 8px 16px rgba(76, 175, 80, 0.3)' }}
                            startIcon={<i className="tabler-phone" />}
                        >
                            Contestar
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            <DisplayArea sx={{
                animation: inCall ? 'none' : 'none', // Remove ringing animation from main display as we have modal
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <StatusBullet isOnline={isOnline} />
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: 1.5,
                            fontWeight: 500
                        }}
                    >
                        {isOnline ? 'En línea' : 'Desconectado'}
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{
                    color: inCall ? 'success.main' : 'text.disabled',
                    fontWeight: 600,
                }}>
                    {inCall ? 'Llamada en curso' : 'Listo para marcar'}
                </Typography>
                <Typography
                    variant="h4"
                    sx={{
                        my: 2,
                        fontWeight: 600,
                        minHeight: 45,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis'
                    }}
                >
                    {phoneNumber || '---'}
                </Typography>
                {inCall && (
                    <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <i className="tabler-dots animate-pulse" /> {formatTime(callTimer)}
                    </Typography>
                )}
            </DisplayArea>

            <CardContent sx={{ pt: 0 }}>
                {/* Teclado Numérico */}
                <Grid container spacing={4} justifyContent="center" sx={{ mb: 6 }}>
                    {digits.map(digit => (
                        <Grid item xs={4} key={digit} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <DialButton onClick={() => handleDigitClick(digit)}>
                                {digit}
                            </DialButton>
                        </Grid>
                    ))}
                </Grid>

                {/* Controles de Volumen y Mute */}
                <Stack spacing={4} sx={{ mb: 6, px: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className={`tabler-volume${volume === 0 ? '-off' : volume < 50 ? '-2' : ''}`} />
                        <Slider
                            size="small"
                            value={volume}
                            onChange={(_, val) => setVolume(val as number)}
                            sx={{ flex: 1 }}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                        <Tooltip title={isMuted ? 'Activar Micrófono' : 'Silenciar'}>
                            <IconButton
                                color={isMuted ? 'error' : 'default'}
                                onClick={() => setIsMuted(!isMuted)}
                                sx={{ backgroundColor: isMuted ? alpha('#FF4C51', 0.1) : 'transparent' }}
                            >
                                <i className={`tabler-microphone${isMuted ? '-off' : ''}`} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Transferir Llamada">
                            <IconButton disabled={!inCall}>
                                <i className="tabler-phone-outgoing" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Borrar">
                            <IconButton onClick={handleBackspace} disabled={phoneNumber.length === 0 || inCall}>
                                <i className="tabler-backspace" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Stack>

                {/* Botón de Llamada Principal */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                    {!inCall ? (
                        <CallActionButton
                            colorType="success"
                            onClick={toggleCall}
                            disabled={phoneNumber.length === 0}
                        >
                            <i className="tabler-phone text-3xl" />
                        </CallActionButton>
                    ) : (
                        <CallActionButton colorType="error" onClick={toggleCall}>
                            <i className="tabler-phone-off text-3xl" />
                        </CallActionButton>
                    )}
                </Box>
            </CardContent>
        </PhoneContainer>
    )
}

export default WebPhone
