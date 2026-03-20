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
}

export default function PipelineKanbanCard({
  card,
  borderColor = 'transparent',
  isUpdating = false,
  isError = false,
  onClick
}: Props) {

  const displayId = card.conversationId.length > 10 
    ? `...${card.conversationId.slice(-6)}` 
    : card.conversationId

  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 2,
        cursor: isUpdating ? 'wait' : 'grab',
        opacity: isUpdating ? 0.7 : 1,
        border: '2px solid',
        borderColor: isError ? 'error.main' : borderColor !== 'transparent' ? borderColor : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 3,
          borderColor: isError ? 'error.main' : borderColor !== 'transparent' ? borderColor : 'primary.main'
        },
        '&:active': {
          cursor: isUpdating ? 'wait' : 'grabbing'
        }
      }}
    >
      <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              src={card.avatarUrl} 
              alt={card.name}
              sx={{ width: 32, height: 32 }}
            >
              {getInitials(card.name)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {card.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                ID: {displayId}
              </Typography>
            </Box>
          </Box>
          <Box>
            {isUpdating ? (
              <CircularProgress size={20} />
            ) : isError ? (
              <Icon icon="tabler:alert-circle" color="error" />
            ) : (
              <Icon icon="tabler:dots-vertical" />
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip 
            label={card.priority} 
            size="small" 
            color={
              card.priority === 'URGENT' ? 'error' : 
              card.priority === 'HIGH' ? 'warning' : 
              card.priority === 'MEDIUM' ? 'info' : 'default'
            }
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
          <Typography variant="caption" color="text.disabled">
            {card.updatedAt}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
