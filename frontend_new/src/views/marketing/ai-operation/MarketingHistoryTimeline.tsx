'use client'

import React, { useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip
} from '@mui/material'
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Search,
  Send,
  BarChart3,
  Users,
  GitBranch
} from 'lucide-react'
import type { MarketingActionEvent } from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Action type configuration
// ---------------------------------------------------------------------------

const ACTION_CONFIG: Record<
  string,
  { color: string; bgColor: string; icon: React.ReactNode; label: string }
> = {
  lead_search_started: {
    color: '#3b82f6',
    bgColor: '#eff6ff',
    icon: <Search size={14} />,
    label: 'Búsqueda iniciada'
  },
  lead_search_completed: {
    color: '#10b981',
    bgColor: '#ecfdf5',
    icon: <CheckCircle2 size={14} />,
    label: 'Búsqueda completada'
  },
  campaign_created: {
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    icon: <Zap size={14} />,
    label: 'Campaña creada'
  },
  message_sent: {
    color: '#06b6d4',
    bgColor: '#ecfeff',
    icon: <Send size={14} />,
    label: 'Mensaje enviado'
  },
  analysis_completed: {
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: <BarChart3 size={14} />,
    label: 'Análisis completado'
  },
  crew_kickoff: {
    color: '#ec4899',
    bgColor: '#fdf2f8',
    icon: <Users size={14} />,
    label: 'Equipo iniciado'
  },
  flow_transition: {
    color: '#6366f1',
    bgColor: '#eef2ff',
    icon: <GitBranch size={14} />,
    label: 'Transición de flujo'
  },
  error: {
    color: '#ef4444',
    bgColor: '#fef2f2',
    icon: <AlertCircle size={14} />,
    label: 'Error'
  }
}

const DEFAULT_CONFIG = {
  color: '#64748b',
  bgColor: '#f8fafc',
  icon: <Info size={14} />,
  label: 'Evento'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MarketingHistoryTimelineProps {
  events: MarketingActionEvent[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MarketingHistoryTimeline: React.FC<MarketingHistoryTimelineProps> = ({ events }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events.length])

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return iso
    }
  }

  if (events.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography color='text.secondary'>No hay eventos recientes</Typography>
      </Paper>
    )
  }

  return (
    <>
      {/* Global keyframes for slide-in animation — using standard <style> tag */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <Paper
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
            Historial de Acciones ({events.length})
          </Typography>
        </Box>

        {/* Scrollable timeline */}
        <Box
          ref={scrollRef}
          sx={{
            maxHeight: 400,
            overflowY: 'auto',
            p: 2
          }}
        >
          <Stack spacing={1.5}>
            {events.map((event, index) => {
              const config = ACTION_CONFIG[event.type] || DEFAULT_CONFIG
              const isLatest = index === events.length - 1

              return (
                <Box
                  key={event.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: isLatest ? config.bgColor : 'transparent',
                    transition: 'background-color 0.3s ease',
                    animation: isLatest ? 'slideIn 0.3s ease-out' : 'none',
                    position: 'relative'
                  }}
                >
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: config.color,
                      mt: 0.75,
                      flexShrink: 0,
                      boxShadow: isLatest ? `0 0 0 3px ${config.color}33` : 'none'
                    }}
                  />

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 0.5 }}>
                      <Chip
                        icon={config.icon}
                        label={config.label}
                        size='small'
                        sx={{
                          bgcolor: config.bgColor,
                          color: config.color,
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          height: 20,
                          '& .MuiChip-icon': { color: config.color }
                        }}
                      />
                      <Typography variant='caption' color='text.secondary'>
                        {formatTime(event.timestamp)}
                      </Typography>
                    </Stack>
                    <Typography variant='body2' sx={{ fontWeight: 500, color: 'text.primary' }}>
                      {event.title}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {event.description}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Stack>
        </Box>
      </Paper>
    </>
  )
}

export default MarketingHistoryTimeline
