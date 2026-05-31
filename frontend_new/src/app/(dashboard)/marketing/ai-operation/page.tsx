'use client'

import React, { useEffect, useState } from 'react'
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
  Zap,
  Loader
} from 'lucide-react'
import { useMarketingAgentsSocket } from '@/hooks/useMarketingAgentsSocket'
import { marketingHistoryService } from '@/services/marketing/marketingHistoryService'
import LiveAgentCard from '@/views/marketing/ai-operation/LiveAgentCard'
import AgentFlowGraph from '@/views/marketing/ai-operation/AgentFlowGraph'
import MarketingHistoryTimeline from '@/views/marketing/ai-operation/MarketingHistoryTimeline'
import type { MarketingAgent, AgentConnection, MarketingActionEvent } from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Connection status chip — now uses connectionStatus from hook
// ---------------------------------------------------------------------------

const ConnectionChip: React.FC<{ connectionStatus: 'connected' | 'disconnected' | 'reconnecting' }> = ({ connectionStatus }) => {
  const config = {
    connected: {
      icon: <Wifi size={16} />,
      label: 'Conectado',
      bgColor: '#ecfdf5',
      color: '#10b981'
    },
    disconnected: {
      icon: <WifiOff size={16} />,
      label: 'Desconectado',
      bgColor: '#fef2f2',
      color: '#ef4444'
    },
    reconnecting: {
      icon: <Loader size={16} />,
      label: 'Reconectando...',
      bgColor: '#fffbeb',
      color: '#f59e0b'
    }
  }

  const c = config[connectionStatus] || config.disconnected

  return (
    <Chip
      icon={c.icon}
      label={c.label}
      size='small'
      sx={{
        bgcolor: c.bgColor,
        color: c.color,
        fontWeight: 600,
        '& .MuiChip-icon': { color: 'inherit' }
      }}
    />
  )
}

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
  // -----------------------------------------------------------------------
  // Resolve tenantId and companyId from auth context / session
  // TODO: Replace with actual auth context lookup (useSession, useAuth, etc.)
  // For now using default tenant 1 — this should come from the authenticated user
  // -----------------------------------------------------------------------
  const tenantId = 1
  const companyId: number | undefined = undefined

  const {
    agents,
    connections,
    events,
    isConnected,
    connectionStatus,
    lastUpdate,
    reconnect
  } = useMarketingAgentsSocket({ tenantId, companyId })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // -----------------------------------------------------------------------
  // Initial data load via REST with AbortController cleanup
  // -----------------------------------------------------------------------
  // CLOUD-218: AbortController prevents state updates on unmounted component.
  // The controller is created before the async call and aborted on unmount,
  // which cancels any in-flight REST request. The error handler guards
  // against AbortError so that intentional cancellation does not set error state.
  // -----------------------------------------------------------------------

  useEffect(() => {
    const controller = new AbortController()

    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch initial action history via REST with AbortSignal
        // The socket hook will receive real-time updates via WebSocket,
        // but the REST data serves as the initial fallback.
        const history = await marketingHistoryService.getActionHistory(
          tenantId,
          50,
          0,
          companyId,
          controller.signal
        )
        if (history) {
          // REST data loaded successfully — socket events will take over
          // for real-time updates from this point forward.
        }
      } catch (err) {
        // Do NOT set error state if the request was intentionally cancelled
        // by the AbortController (component unmounted during in-flight request).
        if ((err as Error).name !== 'AbortError') {
          console.error('[MarketingLiveDashboard] Initial load error:', err)
          setError('Error al cargar los datos iniciales. Usando modo offline.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    // Cleanup: abort any in-flight request when component unmounts
    return () => controller.abort()
  }, [tenantId, companyId])

  // -----------------------------------------------------------------------
  // Manual reconnect handler — triggers both WS reconnect and REST refetch
  // -----------------------------------------------------------------------

  const handleReconnect = () => {
    reconnect()
    // Trigger a fresh REST load by toggling a state key or calling the effect again.
    // Since the useEffect has an empty dependency array, we use a refreshKey approach.
    setRefreshKey(prev => prev + 1)
  }

  // Use a refreshKey to allow manual re-fetch from the reconnect button
  const [refreshKey, setRefreshKey] = useState(0)

  // Separate useEffect for manual reconnection that depends on refreshKey
  useEffect(() => {
    if (refreshKey === 0) return // Skip initial mount (handled by the main useEffect above)

    const controller = new AbortController()

    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)

        const history = await marketingHistoryService.getActionHistory(
          tenantId,
          50,
          0,
          companyId,
          controller.signal
        )
        if (history) {
          // REST re-fetch successful after manual reconnect
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('[MarketingLiveDashboard] Re-fetch error:', err)
          setError('Error al recargar los datos. Usando modo offline.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    return () => controller.abort()
  }, [refreshKey, tenantId, companyId])

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
          {lastUpdate && (
            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
              Última actualización: {new Date(lastUpdate).toLocaleTimeString('es-CO')}
            </Typography>
          )}
        </Box>
        <Stack direction='row' spacing={1.5} alignItems='center'>
          <ConnectionChip connectionStatus={connectionStatus} />
          <Button
            variant='outlined'
            size='small'
            startIcon={<RefreshCw size={16} />}
            onClick={handleReconnect}
            disabled={connectionStatus === 'reconnecting'}
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
          <MarketingHistoryTimeline events={events} />
        </Grid>
      </Grid>
    </Box>
  )
}

export default MarketingLiveDashboardPage
