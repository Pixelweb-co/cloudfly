'use client'

import React from 'react'
import { Box, Fab, Badge } from '@mui/material'
import { Icon } from '@iconify/react'
import { usePopupChat } from '@/contexts/PopupChatContext'
import PopupChatWindow from './PopupChatWindow'

const ChatPopupsContainer: React.FC = () => {
  const { 
    activePopups, 
    closePopup, 
    minimizePopup, 
    openPopup, 
    unreadCount,
    clearUnreadCount 
  } = usePopupChat()

  const handleFabClick = () => {
    const minimized = activePopups.filter(p => p.state === 'minimized')
    if (minimized.length > 0) {
      openPopup(minimized[minimized.length - 1].contact)
    } else if (activePopups.length > 0) {
      openPopup(activePopups[activePopups.length - 1].contact)
    }
    clearUnreadCount()
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'row-reverse',
        alignItems: 'flex-end',
        gap: 3,
        pointerEvents: 'none' // Allows clicking elements behind the container
      }}
    >
      {/* Main Floating Action Button */}
      <Box sx={{ pointerEvents: 'auto', mb: 2 }}>
        <Badge badgeContent={unreadCount} color="error">
          <Fab 
            color="primary" 
            aria-label="chat" 
            onClick={handleFabClick}
            sx={{ width: 56, height: 56 }}
          >
            <Icon icon="tabler:message-circle" fontSize="1.8rem" />
          </Fab>
        </Badge>
      </Box>

      {/* List of active popups, they will stack to the left */}
      {activePopups.map((popup) => (
        <Box key={popup.contact.id} sx={{ pointerEvents: 'auto', mb: popup.state === 'minimized' ? 3 : 0 }}>
          <PopupChatWindow
            contact={popup.contact}
            state={popup.state}
            onClose={() => closePopup(popup.contact.id)}
            onMinimize={() => minimizePopup(popup.contact.id)}
            onToggle={() => {
                if (popup.state === 'minimized') {
                    // Open it
                    openPopup(popup.contact)
                } else {
                    minimizePopup(popup.contact.id)
                }
            }}
          />
        </Box>
      ))}
    </Box>
  )
}

export default ChatPopupsContainer
