'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Divider,
  Fade,
  Zoom
} from '@mui/material'
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  Activity,
  Zap
} from 'lucide-react'
import { useMarketingAgentsSocket } from '@/hooks/useMarketingAgentsSocket'
import { marketingHistoryService } from '@/services/marketing/marketingHistoryService'
import LiveAgentCard from '@/views/marketing/ai-operation/LiveAgentCard'
import AgentFlowGraph from '@/views/marketing/ai-operation/AgentFlowGraph'
import MarketingHistoryTimeline from '@/views/marketing/ai-operation/MarketingHistoryTimeline'
import type { MarketingAgent, AgentConnection, MarketingActionEvent } from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Connection status chip
// ---------------------------------------------------------------------------

const ConnectionChip: React.FC<{ connected: boolean }> = ({ connected }) => (
  <Chip
    icon={connected ? <Wifi size={16} /> : <WifiOff size={16} />}
    label={connected ? 'Conectado' : 'Desconectado'}
    size='small'
    sx={{
      bgcolor: connected ? '#ecfdf5' : '#fef2f2',
      color: connected ? '#10b981' : '#ef4444',
      fontWeight: 600,
      '& .MuiChip-icon': { color: 'inherit' }
    }}
  />
)

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
  <Paper
    sx={{
      p: 2,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5
    }}
  >
    <Box sx={{ color }}>{icon}</Box>
    <Box>
      <Typography variant='h5' sx={{ fontWeight: 700, lineHeight: 1.2 }}>{value}</Typography>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
    </Box>
  </Paper>
)

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

const MarketingLiveDashboardPage: React.FC = () => {
  const {
    agents,
    connections,
    recentEvents,
    isConnected,
    reconnect
  } = useMarketingAgentsSocket()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // -----------------------------------------------------------------------
  // Initial data load via REST
  // -----------------------------------------------------------------------

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Resolve tenantId and companyId from auth context / session
      // For now using default tenant 1 — replace with actual auth context lookup
      const tenantId = 1
      const companyId: number | undefined = undefined

      // Fetch initial action history via REST (provides data before WebSocket connects)
      const history = await marketingHistoryService.getActionHistory(tenantId, 50, 0, companyId)
      if (history) {
        // The socket hook will receive real-time updates via WebSocket,
        // but the REST data serves as the initial fallback.
        // For now, we just verify the endpoint is reachable.
      }
    } catch (err) {
      console.error('[MarketingLiveDashboard] Initial load error:', err)
      setError('Error al cargar los datos iniciales. Usando modo offline.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // -----------------------------------------------------------------------
  // Derived stats
  // -----------------------------------------------------------------------

  const workingCount = agents.filter(a => a.status === 'working').length
  const waitingCount = agents.filter(a => a.status === 'waiting').length
  const errorCount = agents.filter(a => a.status === 'error').length
  const idleCount = agents.filter(a => a.status === 'idle').length

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography
            variant='h4'
            sx={{
              mb: 1,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Activity size={32} className='text-blue-500' />
            Marketing Live Dashboard
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Estado en tiempo real del equipo de marketing — agentes, flujo de trabajo y historial de acciones.
          </Typography>
        </Box>
        <Stack direction='row' spacing={1.5} alignItems='center'>
          <ConnectionChip connected={isConnected} />
          <Button
            variant='outlined'
            size='small'
            startIcon={<RefreshCw size={16} />}
            onClick={() => {
              reconnect()
              loadInitialData()
            }}
          >
            Reconectar
          </Button>
        </Stack>
      </Box>

      {/* Error alert */}
      {error && (
        <Alert severity='warning' sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Users size={24} />}
            label='Agentes Activos'
            value={agents.length}
            color='#3b82f6'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Zap size={24} />}
            label='Trabajando'
            value={workingCount}
            color='#10b981'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Activity size={24} />}
            label='En Espera'
            value={waitingCount}
            color='#f59e0b'
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Activity size={24} />}
            label='Errores'
            value={errorCount}
            color='#ef4444'
          />
        </Grid>
      </Grid>

      {/* Agent Flow Graph */}
      <Paper
        sx={{
          mb: 4,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant='h6' sx={{ fontWeight: 600 }}>
            Flujo de Agentes
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Visualización del flujo de trabajo entre agentes
          </Typography>
        </Box>
        <Box sx={{ p: 2 }}>
          <AgentFlowGraph agents={agents} connections={connections} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Agent Cards */}
        <Grid item xs={12} lg={7}>
          <Paper
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                Estado de Agentes
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Estado en tiempo real de cada agente del equipo
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              {agents.length === 0 ? (
                <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }}>
                  No hay agentes disponibles. Esperando conexión...
                </Typography>
              ) : (
                <Stack direction='row' spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                  {agents.map(agent => (
                    <Zoom in key={agent.id} timeout={500}>
                      <Box>
                        <LiveAgentCard agent={agent} />
                      </Box>
                    </Zoom>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* History Timeline */}
        <Grid item xs={12} lg={5}>
          <MarketingHistoryTimeline events={recentEvents} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default MarketingLiveDashboardPage
