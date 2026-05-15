import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Avatar,
  Chip
} from '@mui/material'
import type { PipelineKanbanCard as PipelineKanbanCardType } from '@/types/marketing/pipelineTypes'
import { getInitials } from '@/utils/getInitials'
import { Icon } from '@iconify/react'

interface Props {
  card: PipelineKanbanCardType
  borderColor?: string
  isUpdating?: boolean
  isError?: boolean
  onClick?: () => void
  onToggleChatbot?: () => void
}

export default function PipelineKanbanCard({
  card,
  borderColor = 'transparent',
  isUpdating = false,
  isError = false,
  onClick,
  onToggleChatbot
}: Props) {

  const conversationId = card.conversationId || ''
  const displayId = conversationId.length > 10 
    ? `...${conversationId.slice(-6)}` 
    : conversationId || 'N/A'

  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 2,
        cursor: isUpdating ? 'wait' : 'grab',
        opacity: isUpdating ? 0.7 : 1,
        border: '2px solid',
        borderColor: (card.unreadCount && card.unreadCount > 0) 
          ? '#cddc39' // Lime
          : (isError ? 'error.main' : borderColor !== 'transparent' ? borderColor : 'divider'),
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          borderColor: (card.unreadCount && card.unreadCount > 0) 
            ? '#cddc39' 
            : (isError ? 'error.main' : borderColor !== 'transparent' ? borderColor : 'primary.main')
        },
        '&:active': {
          cursor: isUpdating ? 'wait' : 'grabbing'
        }
      }}
    >
      <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={card.avatarUrl} 
                alt={card.name}
                sx={{ width: 40, height: 40 }}
              >
                {getInitials(card.name)}
              </Avatar>
              {card.unreadCount && card.unreadCount > 0 && (
                <Chip 
                  label={card.unreadCount} 
                  size="small" 
                  sx={{ 
                    position: 'absolute', 
                    top: -5, 
                    right: -5, 
                    height: 18, 
                    minWidth: 18, 
                    fontSize: '0.65rem',
                    backgroundColor: '#cddc39',
                    color: 'black',
                    fontWeight: 'bold',
                    p: 0
                  }} 
                />
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {card.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                {card.phone || displayId}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {card.channel && (
              <Icon 
                icon={
                  card.channel.toUpperCase() === 'WHATSAPP' ? 'tabler:brand-whatsapp' :
                  card.channel.toUpperCase() === 'FACEBOOK' ? 'tabler:brand-facebook' :
                  card.channel.toUpperCase() === 'INSTAGRAM' ? 'tabler:brand-instagram' :
                  'tabler:message'
                } 
                fontSize={18}
                color={card.channel.toUpperCase() === 'WHATSAPP' ? '#25D366' : 'inherit'}
              />
            )}
            {isUpdating ? (
              <CircularProgress size={16} />
            ) : (
              <Icon icon="tabler:dots-vertical" fontSize={18} />
            )}
          </Box>
        </Box>

        {card.lastMessage && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: '-webkit-box', 
              WebkitLineClamp: 2, 
              WebkitBoxOrient: 'vertical', 
              overflow: 'hidden',
              mb: 2,
              lineHeight: 1.2,
              color: 'text.secondary'
            }}
          >
            {card.lastMessage}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Icon 
              icon={card.chatbotEnabled ? 'tabler:robot' : 'tabler:robot-off'} 
              fontSize={18} 
              color={card.chatbotEnabled ? '#cddc39' : 'text.disabled'}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleChatbot?.()
              }}
            />
            <Chip 
              label={card.priority} 
              size="small" 
              color={
                card.priority === 'URGENT' ? 'error' : 
                card.priority === 'HIGH' ? 'warning' : 
                card.priority === 'MEDIUM' ? 'info' : 'default'
              }
              sx={{ height: 18, fontSize: '0.6rem' }}
            />
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
            {card.lastMessageAt ? new Date(card.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
