'use client'

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Stack
} from '@mui/material'
import {
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import type { MarketingAgent, AgentStatus } from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  AgentStatus,
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  idle: {
    color: '#94a3b8',
    bgColor: '#f1f5f9',
    icon: <Pause size={16} />,
    label: 'En espera'
  },
  working: {
    color: '#3b82f6',
    bgColor: '#eff6ff',
    icon: <Play size={16} />,
    label: 'Trabajando'
  },
  waiting: {
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: <Clock size={16} />,
    label: 'Esperando'
  },
  error: {
    color: '#ef4444',
    bgColor: '#fef2f2',
    icon: <AlertCircle size={16} />,
    label: 'Error'
  },
  completed: {
    color: '#10b981',
    bgColor: '#ecfdf5',
    icon: <CheckCircle2 size={16} />,
    label: 'Completado'
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LiveAgentCardProps {
  agent: MarketingAgent;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LiveAgentCard: React.FC<LiveAgentCardProps> = ({ agent }) => {
  const config = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return iso
    }
  }

  return (
    <Card
      sx={{
        minWidth: 260,
        maxWidth: 320,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)'
        },
        /* Pulse animation for working status */
        ...(agent.status === 'working' && {
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: '14px',
            border: `2px solid ${config.color}`,
            opacity: 0.4,
            animation: 'pulse-ring 2s ease-out infinite'
          }
        })
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header: Avatar + Name + Status Chip */}
        <Stack direction='row' spacing={1.5} alignItems='center' sx={{ mb: 2 }}>
          <Avatar
            src={agent.avatar}
            sx={{
              width: 44,
              height: 44,
              bgcolor: agent.color || config.color,
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            {agent.displayName?.charAt(0) || agent.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant='subtitle1'
              sx={{ fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {agent.displayName || agent.name}
            </Typography>
            {agent.role && (
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                {agent.role}
              </Typography>
            )}
            <Chip
              icon={config.icon}
              label={config.label}
              size='small'
              sx={{
                mt: 0.5,
                bgcolor: config.bgColor,
                color: config.color,
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
                '& .MuiChip-icon': { color: config.color }
              }}
            />
          </Box>
        </Stack>

        {/* Current Task */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Tarea actual
          </Typography>
          <Typography
            variant='body2'
            sx={{
              mt: 0.5,
              fontWeight: 500,
              color: agent.status === 'idle' ? 'text.secondary' : 'text.primary',
              fontStyle: agent.status === 'idle' ? 'italic' : 'normal'
            }}
          >
            {agent.currentTask || 'Sin tarea asignada'}
          </Typography>
        </Box>

        {/* Last Activity */}
        <Typography variant='caption' color='text.secondary'>
          Última actividad: {formatTime(agent.lastActivity)}
        </Typography>
      </CardContent>

      {/* Global keyframes for pulse animation */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.04);
            opacity: 0;
          }
        }
      `}</style>
    </Card>
  )
}

export default LiveAgentCard
