'use client'

import React, { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import type { MarketingAgent, AgentConnection } from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const CARD_WIDTH = 260
const CARD_HEIGHT = 120
const H_GAP = 60
const V_GAP = 80
const SVG_PADDING = 40

// ---------------------------------------------------------------------------
// Data flow color mapping
// ---------------------------------------------------------------------------

const DATA_FLOW_COLORS: Record<string, string> = {
  leads: '#3b82f6',
  analysis: '#8b5cf6',
  messages: '#06b6d4',
  context: '#f59e0b'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AgentFlowGraphProps {
  agents: MarketingAgent[];
  connections: AgentConnection[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AgentFlowGraph: React.FC<AgentFlowGraphProps> = ({ agents, connections }) => {
  // -----------------------------------------------------------------------
  // Compute node positions — use agent.position if available, otherwise grid
  // -----------------------------------------------------------------------

  const cols = Math.max(1, Math.ceil(Math.sqrt(agents.length)))

  const nodePositions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    agents.forEach((agent, index) => {
      if (agent.position && typeof agent.position.x === 'number' && typeof agent.position.y === 'number') {
        // Use position from agent data
        map[agent.id] = {
          x: SVG_PADDING + agent.position.x,
          y: SVG_PADDING + agent.position.y
        }
      } else {
        // Fallback to grid layout
        const col = index % cols
        const row = Math.floor(index / cols)
        map[agent.id] = {
          x: SVG_PADDING + col * (CARD_WIDTH + H_GAP) + CARD_WIDTH / 2,
          y: SVG_PADDING + row * (CARD_HEIGHT + V_GAP) + CARD_HEIGHT / 2
        }
      }
    })
    return map
  }, [agents, cols])

  // Calculate SVG dimensions based on actual positions
  const positions = Object.values(nodePositions)
  const maxX = positions.length > 0 ? Math.max(...positions.map(p => p.x)) + CARD_WIDTH / 2 + SVG_PADDING : 800
  const maxY = positions.length > 0 ? Math.max(...positions.map(p => p.y)) + CARD_HEIGHT / 2 + SVG_PADDING : 600
  const svgWidth = Math.max(800, maxX)
  const svgHeight = Math.max(600, maxY)

  // -----------------------------------------------------------------------
  // Helper: build a curved SVG path between two points
  // -----------------------------------------------------------------------

  const buildPath = (x1: number, y1: number, x2: number, y2: number): string => {
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    // Offset the control point perpendicular to the line for a curve
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const curvature = 30
    const cx = midX + (-dy / len) * curvature
    const cy = midY + (dx / len) * curvature
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (agents.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography color='text.secondary'>No hay agentes para mostrar</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ overflowX: 'auto', pb: 2 }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ minWidth: svgWidth }}
      >
        <defs>
          {/* Arrowhead marker */}
          <marker
            id='arrowhead'
            markerWidth='10'
            markerHeight='7'
            refX='10'
            refY='3.5'
            orient='auto'
          >
            <polygon points='0 0, 10 3.5, 0 7' fill='#94a3b8' />
          </marker>
          {/* Animated gradient for active connections */}
          <linearGradient id='flowGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#3b82f6' stopOpacity='0.3' />
            <stop offset='50%' stopColor='#3b82f6' stopOpacity='1' />
            <stop offset='100%' stopColor='#3b82f6' stopOpacity='0.3' />
            <animate attributeName='x1' values='0%;100%;0%' dur='3s' repeatCount='indefinite' />
            <animate attributeName='x2' values='100%;200%;100%' dur='3s' repeatCount='indefinite' />
          </linearGradient>
        </defs>

        {/* Draw connections */}
        {connections.map((conn) => {
          const fromPos = nodePositions[conn.sourceAgentId]
          const toPos = nodePositions[conn.targetAgentId]
          if (!fromPos || !toPos) return null

          const pathD = buildPath(fromPos.x, fromPos.y, toPos.x, toPos.y)

          // Check if either agent is working → animate the flow
          const fromAgent = agents.find(a => a.id === conn.sourceAgentId)
          const toAgent = agents.find(a => a.id === conn.targetAgentId)
          const isActive = conn.active && (
            fromAgent?.status === 'working' || toAgent?.status === 'working'
          )

          // Determine stroke color based on dataFlow
          const strokeColor = isActive
            ? 'url(#flowGradient)'
            : (conn.dataFlow && DATA_FLOW_COLORS[conn.dataFlow])
              ? DATA_FLOW_COLORS[conn.dataFlow]
              : '#cbd5e1'

          return (
            <g key={conn.id || `${conn.sourceAgentId}-${conn.targetAgentId}`}>
              {/* Connection line */}
              <path
                d={pathD}
                fill='none'
                stroke={strokeColor}
                strokeWidth={isActive ? 3 : 2}
                markerEnd='url(#arrowhead)'
                strokeDasharray={isActive ? 'none' : '6 4'}
              />
              {/* Label */}
              {conn.label && (
                <text
                  x={(fromPos.x + toPos.x) / 2}
                  y={(fromPos.y + toPos.y) / 2 - 8}
                  textAnchor='middle'
                  fontSize='11'
                  fill='#64748b'
                  fontWeight={500}
                >
                  {conn.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Draw agent nodes */}
        {agents.map(agent => {
          const pos = nodePositions[agent.id]
          if (!pos) return null

          const statusColor =
            agent.status === 'working' ? '#3b82f6' :
            agent.status === 'waiting' ? '#f59e0b' :
            agent.status === 'error' ? '#ef4444' :
            agent.status === 'completed' ? '#10b981' : '#94a3b8'

          return (
            <g key={agent.id}>
              {/* Card background */}
              <rect
                x={pos.x - CARD_WIDTH / 2}
                y={pos.y - CARD_HEIGHT / 2}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                rx={12}
                fill='#fff'
                stroke={statusColor}
                strokeWidth={2}
              />
              {/* Status indicator dot */}
              <circle
                cx={pos.x + CARD_WIDTH / 2 - 14}
                cy={pos.y - CARD_HEIGHT / 2 + 14}
                r={6}
                fill={statusColor}
              >
                {agent.status === 'working' && (
                  <animate attributeName='r' values='6;9;6' dur='1.5s' repeatCount='indefinite' />
                )}
              </circle>
              {/* Agent name */}
              <text
                x={pos.x}
                y={pos.y - 8}
                textAnchor='middle'
                fontSize='13'
                fontWeight={700}
                fill='#1e293b'
              >
                {agent.displayName || agent.name}
              </text>
              {/* Current task (truncated) */}
              <text
                x={pos.x}
                y={pos.y + 12}
                textAnchor='middle'
                fontSize='11'
                fill='#64748b'
              >
                {agent.currentTask && agent.currentTask.length > 28
                  ? agent.currentTask.substring(0, 28) + '…'
                  : agent.currentTask || 'Sin tarea'}
              </text>
            </g>
          )
        })}
      </svg>
    </Box>
  )
}

export default AgentFlowGraph
