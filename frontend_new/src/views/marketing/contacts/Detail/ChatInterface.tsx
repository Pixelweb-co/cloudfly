'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar, Box, Card, CircularProgress, IconButton, InputBase, Switch, Tooltip, Typography, Tabs, Tab } from '@mui/material'
import { Contact } from '@/types/marketing/contactTypes'
import { Icon } from '@iconify/react'
import { chatService, ChatMessage } from '@/services/marketing/chatService'
import { useChatSocket } from '@/hooks/useChatSocket'
import { userMethods } from '@/utils/userMethods'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import axiosInstance from '@/utils/axiosInstance'
import { AuthManager } from '@/utils/authManager'

interface Props {
  contact: Contact | null;
  isNew: boolean;
}

export default function ChatInterface({ contact, isNew }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<'WHATSAPP' | 'FACEBOOK'>('WHATSAPP')
  const [chatbotEnabled, setChatbotEnabled] = useState<boolean>(
    contact?.chatbotEnabled !== undefined ? contact.chatbotEnabled : true
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  // Audio Recording States & Refs
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      audioChunksRef.current = []
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Solo enviamos si no fue cancelado (indicado por isRecording siendo falso antes de llamar a stop)
        // Pero usamos una variable local para seguridad
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Iniciar cronómetro
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('No se pudo acceder al micrófono. Asegúrate de estar en una conexión segura (HTTPS).')
    }
  }

  const stopRecording = (shouldSend: boolean = true) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && isRecording) {
      const recorder = mediaRecorderRef.current
      
      recorder.onstop = async () => {
        if (shouldSend && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' })
          await handleSendAudio(audioBlob)
        }
        // Cleanup stream
        if (recorder.stream) {
          recorder.stream.getTracks().forEach(track => track.stop())
        }
      }

      recorder.stop()
      setIsRecording(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendAudio = async (blob: Blob) => {
    if (!contact?.phone) return
    
    setSending(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        
        const sentMsg = await chatService.sendMessage({
          conversationId: contact.phone,
          contactId: Number(contact.id),
          body: '[Nota de Voz]',
          mediaType: 'AUDIO',
          mediaUrl: base64Audio,
          platform: activeTab
        })

        setMessages(prev => {
          if (prev.find(m => m.id === sentMsg.id)) return prev
          return [...prev, sentMsg]
        })
      }
    } catch (error) {
      console.error('Error sending audio:', error)
    } finally {
      setSending(false)
    }
  }

  // Sync chatbot state when contact changes
  useEffect(() => {
    if (contact?.chatbotEnabled !== undefined) {
      setChatbotEnabled(contact.chatbotEnabled)
    }
  }, [contact?.chatbotEnabled])

  // Toggle chatbot on/off
  const handleToggleChatbot = async () => {
    if (!contact?.id) return
    const newValue = !chatbotEnabled
    setChatbotEnabled(newValue) // Optimistic UI
    try {
      await axiosInstance.post(`/api/contacts/${contact.id}/chatbot-toggle`, { enabled: newValue })
    } catch (error) {
      console.error('Error toggling chatbot:', error)
      setChatbotEnabled(!newValue) // Rollback on error
    }
  }

  // Use phone as conversationId for now (Evolution API uses JID which is based on phone)
  const conversationId = contact?.phone || ''

  // Real-time listener using Contact Phone (resilient to duplicates)
  const onNewMessage = useCallback((msg: any) => {
    // Normalización inmediata si viene con formato de socket
    const normalizedMsg = {
      ...msg,
      body: msg.body || msg.content || (msg.message?.content),
      sentAt: msg.sentAt || msg.createdAt || new Date().toISOString(),
      direction: msg.direction || (msg.message?.direction),
      mediaType: msg.mediaType || (msg.message?.mediaType),
      mediaUrl: msg.mediaUrl || (msg.message?.mediaUrl)
    };
    setMessages((prev) => {
      // Evitar duplicados si el mensaje ya existe (ej. mensaje enviado por nosotros)
      if (prev.find(m => m.id === normalizedMsg.id)) return prev;
      return [...prev, normalizedMsg];
    })
  }, [])

  useChatSocket({
    conversationId: contact?.uuid || '',
    phone: contact?.phone || '',
    onNewMessage: onNewMessage
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Fetch history
  useEffect(() => {
    const fetchHistory = async () => {
      if (contact?.uuid && !isNew) {
        setLoading(true)
        try {
          const user = userMethods.getUserLogin()
          const tenantId = user?.customerId || user?.tenant_id

          if (!tenantId) {
            console.warn('No tenantId found for history fetch')
            return
          }

          const history = await chatService.getMessages(contact.uuid, tenantId)
          setMessages(history)
        } catch (error) {
          console.error('Error fetching chat history:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchHistory()
  }, [contact?.uuid, isNew])

  // Handler for sending
  const handleSend = async () => {
    if (!newMessage.trim() || !contact?.phone || sending) return

    setSending(true)
    try {
      const sentMsg = await chatService.sendMessage({
        conversationId: contact.phone,
        contactId: Number(contact.id),
        body: newMessage,
        platform: activeTab
      })

      // Update local state (socket will also broadcast but current user needs it immediately if socket delay occurs)
      // Actually common practice is to let socket handle it, but here we add for better UX if we don't have echo
      setMessages(prev => {
        if (prev.find(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  // Oculto por completo si es un contacto nuevo (no guardado en DB)
  if (isNew || !contact) {
    return null
  }

  const getInitials = (name?: string) => {
    if (!name) return 'C'
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  const renderMessageBody = (msg: any) => {
    const text = msg.body || ''
    const mediaUrl = msg.mediaUrl
    const mediaType = msg.mediaType || msg.messageType

    // Explicit Media handling
    if (mediaType === 'audio' || mediaType === 'AUDIO') {
      return (
        <Box sx={{ minWidth: 220, py: 1 }}>
          <audio 
            controls 
            src={mediaUrl} 
            style={{ width: '100%', height: '40px' }} 
            controlsList="nodownload"
          />
        </Box>
      )
    }

    if (mediaType === 'image' || mediaType === 'IMAGE') {
      return (
        <Box>
          <Box
            component="img"
            src={mediaUrl}
            alt="Media"
            sx={{ 
              maxWidth: '100%', 
              maxHeight: 350, 
              borderRadius: 1, 
              mb: text && text !== '[Image Message]' ? 1 : 0, 
              objectFit: 'contain', 
              display: 'block',
              cursor: 'pointer'
            }}
            onClick={() => window.open(mediaUrl, '_blank')}
          />
          {text && text !== '[Image Message]' && (
            <Typography variant="body2" color="inherit" sx={{ whiteSpace: 'pre-wrap' }}>
              {text}
            </Typography>
          )}
        </Box>
      )
    }

    // Legacy Markdown/Regex fallback for [URL] format
    const mediaRegex = /^\[(https?:\/\/[^\]]+)\]\s*\n/
    const match = text.match(mediaRegex)

    if (match) {
      const url = match[1]
      const remainingText = text.replace(mediaRegex, '').trim()
      return (
        <Box>
          <Box
            component="img"
            src={url}
            alt="Media"
            sx={{ maxWidth: '100%', maxHeight: 250, borderRadius: 1, mb: 1, objectFit: 'contain', display: 'block' }}
          />
          <Typography variant="body2" color="inherit" sx={{ whiteSpace: 'pre-wrap' }}>
            {remainingText}
          </Typography>
        </Box>
      )
    }

    return (
      <Typography variant="body2" color="inherit" sx={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </Typography>
    )
  }

  return (
    <Card sx={{ height: '700px', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
      {/* Header */}
      <Box
        sx={{
          p: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        <Box display="flex" alignItems="center" gap={3}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
            {getInitials(contact.name)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {contact.name}
            </Typography>
            <Typography variant="body2" sx={{ color: activeTab === 'WHATSAPP' ? 'success.main' : 'info.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activeTab === 'WHATSAPP' ? 'success.main' : 'info.main' }} />
              {activeTab === 'WHATSAPP' ? 'WhatsApp Online' : 'Facebook Online'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <Tooltip title={chatbotEnabled ? 'Chatbot IA Activo' : 'Chatbot IA Desactivado'}>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Icon
                icon={chatbotEnabled ? 'tabler:robot' : 'tabler:robot-off'}
                fontSize="1.2rem"
                style={{ color: chatbotEnabled ? '#4caf50' : '#9e9e9e' }}
              />
              <Switch
                size="small"
                checked={chatbotEnabled}
                onChange={handleToggleChatbot}
                color="success"
                sx={{ mr: 1 }}
              />
            </Box>
          </Tooltip>
          <IconButton color="primary" sx={{ bgcolor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.08)' }}>
            <Icon icon="tabler:phone-call" />
          </IconButton>
          <IconButton color="secondary">
            <Icon icon="tabler:dots-vertical" />
          </IconButton>
        </Box>
      </Box>

      {/* Channel Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="channel tabs"
        >
          <Tab 
            label="WhatsApp" 
            value="WHATSAPP" 
            icon={<Icon icon="tabler:brand-whatsapp" fontSize={20} />} 
            iconPosition="start" 
            sx={{ minHeight: 48 }}
          />
          <Tab 
            label="Facebook Messenger" 
            value="FACEBOOK" 
            icon={<Icon icon="tabler:brand-messenger" fontSize={20} />} 
            iconPosition="start" 
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Chat Body (Messages) */}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          p: 5,
          overflowY: 'auto',
          bgcolor: 'action.hover',
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress size={30} />
          </Box>
        ) : messages.length === 0 ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" sx={{ opacity: 0.5 }}>
            <Icon icon="tabler:message-off" fontSize="3rem" />
            <Typography variant="body2" sx={{ mt: 2 }}>No hay mensajes todavía</Typography>
          </Box>
        ) : (
          messages.map((msg, index) => {
            const isOutbound = msg.direction === 'OUTBOUND'
            return (
              <Box
                key={msg.id || index}
                display="flex"
                gap={2}
                maxWidth="80%"
                alignSelf={isOutbound ? 'flex-end' : 'flex-start'}
                flexDirection={isOutbound ? 'row-reverse' : 'row'}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: isOutbound ? 'secondary.main' : 'primary.light', fontSize: '0.875rem' }}>
                  {isOutbound ? 'YO' : getInitials(contact.name)}
                </Avatar>
                <Box>
                  <Box
                    sx={{
                      bgcolor: isOutbound ? 'primary.main' : 'background.paper',
                      color: isOutbound ? 'primary.contrastText' : 'text.primary',
                      p: 3,
                      borderRadius: 2,
                      borderTopRightRadius: isOutbound ? 0 : 2,
                      borderTopLeftRadius: isOutbound ? 2 : 0,
                      boxShadow: 1
                    }}
                  >
                    {renderMessageBody(msg)}
                  </Box>
                  <Box display="flex" justifyContent={isOutbound ? 'flex-end' : 'flex-start'} alignItems="center" gap={1} mt={1}>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {msg.sentAt ? format(new Date(msg.sentAt), 'hh:mm a') : ''}
                    </Typography>
                    {isOutbound && (
                      <Icon
                        icon={msg.status === 'READ' ? 'tabler:checks' : 'tabler:check'}
                        fontSize="1rem"
                        sx={{ color: msg.status === 'READ' ? 'primary.main' : 'text.disabled' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            )
          })
        )}
      </Box>

      {/* Footer / Input Area */}
      <Box sx={{ p: 4, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'action.hover',
            borderRadius: 8,
            p: 1.5,
            px: 3
          }}
        >
          {isRecording ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, ml: 2 }}>
              <Typography variant="body2" color="error" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ 
                  width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main',
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.3 }, '100%': { opacity: 1 } }
                }} />
                GRABANDO {formatTime(recordingTime)}
              </Typography>
              <Box sx={{ flex: 1, height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ 
                  width: '100%', height: '100%', bgcolor: 'error.main', opacity: 0.2,
                  animation: 'wave 2s infinite linear',
                  '@keyframes wave': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } }
                }} />
              </Box>
              <IconButton color="error" size="small" onClick={() => stopRecording(false)}>
                <Icon icon="tabler:trash" />
              </IconButton>
            </Box>
          ) : (
            <InputBase
              placeholder="Escribe un mensaje..."
              fullWidth
              multiline
              maxRows={4}
              value={newMessage}
              disabled={sending}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              sx={{ ml: 1, flex: 1 }}
            />
          )}

          <IconButton 
            color="primary"
            size="small"
            onClick={isRecording ? () => stopRecording(true) : (newMessage.trim() ? handleSend : startRecording)}
            disabled={sending}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
            }}
          >
            {sending ? <CircularProgress size={20} color="inherit" /> : <Icon icon={isRecording ? 'tabler:send' : (newMessage.trim() ? 'tabler:send' : 'tabler:microphone')} />}
          </IconButton>
        </Box>
      </Box>
    </Card>
  )
}
