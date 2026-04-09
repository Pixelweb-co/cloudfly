'use client'

import React from 'react'
import {
  Card,
  Box,
  Typography,
  IconButton,
  Avatar,
  InputBase,
  Divider,
} from '@mui/material'
import { Contact } from '@/types/marketing/contactTypes'
import { Icon } from '@iconify/react'

interface Props {
  contact: Contact | null;
  isNew: boolean;
}

export default function ChatInterface({ contact, isNew }: Props) {
  // Oculto por completo si es un contacto nuevo (no guardado en DB)
  if (isNew || !contact) {
    return null
  }

  // Helper to extract initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'C'
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Card sx={{ height: '700px', display: 'flex', flexDirection: 'column' }}>
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
            <Typography variant="body2" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
              Conectado (WhatsApp)
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton color="primary" sx={{ bgcolor: 'primary.lighter' }}>
            <Icon icon="tabler:phone-call" />
          </IconButton>
          <IconButton color="secondary" sx={{ bgcolor: 'action.hover' }}>
            <Icon icon="tabler:dots-vertical" />
          </IconButton>
        </Box>
      </Box>

      {/* Chat Body (Messages) */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          p: 5, 
          overflowY: 'auto',
          bgcolor: 'action.hover', // Slight background pattern/color for chat area
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
        className="chat-body"
      >
        {/* Mock Incoming Message */}
        <Box display="flex" gap={2} maxWidth="80%">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.875rem' }}>
            {getInitials(contact.name)}
          </Avatar>
          <Box>
            <Box 
              sx={{ 
                bgcolor: 'background.paper', 
                p: 3, 
                borderRadius: 2, 
                borderTopLeftRadius: 0,
                boxShadow: 1
              }}
            >
              <Typography variant="body2">
                Hola, acabo de ver su catálogo. Quisiera más información sobre los servicios.
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
              10:42 AM
            </Typography>
          </Box>
        </Box>

        {/* Mock Outgoing Message */}
        <Box display="flex" gap={2} maxWidth="80%" alignSelf="flex-end" flexDirection="row-reverse">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.875rem' }}>
            A
          </Avatar>
          <Box>
            <Box 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText',
                p: 3, 
                borderRadius: 2, 
                borderTopRightRadius: 0,
                boxShadow: 1
              }}
            >
              <Typography variant="body2" color="inherit">
                ¡Hola! Claro que sí, con mucho gusto. ¿Hay algún servicio en particular que te interese? Te envío nuestro portafolio en PDF.
              </Typography>
            </Box>
            <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mt={1}>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                10:45 AM
              </Typography>
              <Icon icon="tabler:checks" fontSize="1rem" className="text-primary" />
            </Box>
          </Box>
        </Box>

        {/* Mock Outgoing Document */}
        <Box display="flex" gap={2} maxWidth="80%" alignSelf="flex-end" flexDirection="row-reverse">
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.875rem' }}>
            A
          </Avatar>
          <Box>
            <Box 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText',
                p: 2, 
                borderRadius: 2, 
                borderTopRightRadius: 0,
                boxShadow: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                <Icon icon="tabler:file-pdf" fontSize="1.5rem" />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold">Portafolio_Servicios.pdf</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>2.4 MB • Documento</Typography>
              </Box>
            </Box>
            <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mt={1}>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                10:45 AM
              </Typography>
              <Icon icon="tabler:check" fontSize="1rem" className="text-secondary" />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer / Input Area */}
      <Box sx={{ p: 3, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            bgcolor: 'action.hover', 
            borderRadius: 8, 
            p: 1,
            px: 2
          }}
        >
          {/* Attachments Menu */}
          <IconButton color="secondary">
            <Icon icon="tabler:paperclip" />
          </IconButton>
          <IconButton color="secondary">
            <Icon icon="tabler:photo" />
          </IconButton>

          {/* Input field */}
          <InputBase
            placeholder="Escribe un mensaje..."
            fullWidth
            sx={{ ml: 1, flex: 1 }}
          />

          {/* Actions */}
          <IconButton color="secondary">
            <Icon icon="tabler:mood-smile" />
          </IconButton>
          <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1 }} />
          <IconButton color="secondary">
            <Icon icon="tabler:microphone" />
          </IconButton>
          <IconButton 
            color="primary" 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white', 
              '&:hover': { bgcolor: 'primary.dark' } 
            }}
          >
            <Icon icon="tabler:send" />
          </IconButton>
        </Box>
      </Box>
    </Card>
  )
}
