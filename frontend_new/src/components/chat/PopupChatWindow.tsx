'use client'

import React from 'react'
import { Box, Paper, Typography, IconButton, Avatar, Tooltip } from '@mui/material'
import { Icon } from '@iconify/react'
import { Contact } from '@/types/marketing/contactTypes'
import ChatInterface from '@/views/marketing/contacts/Detail/ChatInterface'
import { useRouter } from 'next/navigation'

interface PopupChatWindowProps {
  contact: Contact
  state: 'open' | 'minimized'
  onClose: () => void
  onMinimize: () => void
  onToggle: () => void
}

const PopupChatWindow: React.FC<PopupChatWindowProps> = ({ 
  contact, 
  state, 
  onClose, 
  onMinimize, 
  onToggle 
}) => {
  const router = useRouter()

  const handleViewContact = () => {
    router.push(`/marketing/contacts/${contact.id}`)
  }

  if (state === 'minimized') {
    return (
      <Tooltip title={contact.name} placement="top">
        <Avatar 
          src={contact.profilePicture} 
          onClick={onToggle}
          sx={{ 
            width: 48, 
            height: 48, 
            cursor: 'pointer', 
            boxShadow: 3,
            border: '2px solid white',
            bgcolor: 'primary.main',
            '&:hover': { transform: 'scale(1.1)', transition: '0.2s' }
          }}
        >
          {contact.name?.charAt(0) || 'C'}
        </Avatar>
      </Tooltip>
    )
  }

  return (
    <Paper
      elevation={6}
      sx={{
        width: 330,
        height: 480,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '8px 8px 0 0',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.paper'
      }}
    >
      {/* Custom Popup Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          cursor: 'pointer'
        }}
        onClick={onMinimize}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={contact.profilePicture} 
            sx={{ width: 32, height: 32, border: '1px solid white' }}
          >
            {contact.name?.charAt(0)}
          </Avatar>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Ver Contacto">
            <IconButton size="small" color="inherit" onClick={(e) => { e.stopPropagation(); handleViewContact(); }}>
              <Icon icon="tabler:external-link" fontSize="1.1rem" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" color="inherit" onClick={(e) => { e.stopPropagation(); onMinimize(); }}>
            <Icon icon="tabler:minus" fontSize="1.1rem" />
          </IconButton>
          <IconButton size="small" color="inherit" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <Icon icon="tabler:x" fontSize="1.1rem" />
          </IconButton>
        </Box>
      </Box>

      {/* Reusing ChatInterface with isPopup prop */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <ChatInterface 
          contact={contact} 
          isNew={false} 
          isPopup={true} 
        />
      </Box>
    </Paper>
  )
}

export default PopupChatWindow
