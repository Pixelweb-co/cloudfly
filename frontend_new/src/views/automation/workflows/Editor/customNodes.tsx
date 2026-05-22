'use client'

import React from 'react'
import { Handle, Position } from 'reactflow'
import { Box, Card, Typography, Avatar } from '@mui/material'
import { Icon } from '@iconify/react'

// Custom Trigger Node Component
export const TriggerNode = ({ data }: any) => {
  const color = data.color || '#7367F0'
  
  return (
    <Card
      sx={{
        bgcolor: '#1c2138',
        border: `1.5px solid ${color}aa`,
        borderRadius: '12px',
        boxShadow: `0 4px 15px ${color}1a, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        p: 3,
        minWidth: 220,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        position: 'relative',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 6px 20px ${color}33`,
          transform: 'translateY(-2px)'
        }
      }}
    >
      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 34, height: 34 }}>
        <Icon icon={data.icon || 'tabler:play'} fontSize="1.25rem" />
      </Avatar>
      
      <Box flexGrow={1}>
        <Typography variant="caption" sx={{ color: color, fontWeight: 700, display: 'block', fontSize: '9px', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          DISPARADOR
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
          {data.label}
        </Typography>
      </Box>

      {/* Target/Source handles */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: color,
          width: 10,
          height: 10,
          border: '2px solid #1c2138',
          right: -5
        }}
      />
    </Card>
  )
}

// Custom Action Node Component
export const ActionNode = ({ data }: any) => {
  const color = data.color || '#28C76F'
  
  return (
    <Card
      sx={{
        bgcolor: '#1c2138',
        border: `1.5px solid ${color}aa`,
        borderRadius: '12px',
        boxShadow: `0 4px 15px ${color}1a, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        p: 3,
        minWidth: 220,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        position: 'relative',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 6px 20px ${color}33`,
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Input connection point */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#a0a3b5',
          width: 8,
          height: 8,
          border: '1.5px solid #1c2138',
          left: -4
        }}
      />

      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 34, height: 34 }}>
        <Icon icon={data.icon || 'tabler:circle-check'} fontSize="1.25rem" />
      </Avatar>
      
      <Box flexGrow={1}>
        <Typography variant="caption" sx={{ color: color, fontWeight: 700, display: 'block', fontSize: '9px', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          ACCIÓN
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
          {data.label}
        </Typography>
      </Box>

      {/* Output connection point */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          background: color,
          width: 10,
          height: 10,
          border: '2px solid #1c2138',
          right: -5
        }}
      />
    </Card>
  )
}

// Custom Logic Node Component (Conditional IF)
export const LogicNode = ({ data }: any) => {
  const color = data.color || '#EA5455'
  
  return (
    <Card
      sx={{
        bgcolor: '#1c2138',
        border: `1.5px solid ${color}aa`,
        borderRadius: '12px',
        boxShadow: `0 4px 15px ${color}1a, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
        p: 3,
        minWidth: 240,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        position: 'relative',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 6px 20px ${color}33`,
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Input connection point */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          background: '#a0a3b5',
          width: 8,
          height: 8,
          border: '1.5px solid #1c2138',
          left: -4
        }}
      />

      <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 34, height: 34 }}>
        <Icon icon={data.icon || 'tabler:git-branch'} fontSize="1.25rem" />
      </Avatar>
      
      <Box flexGrow={1}>
        <Typography variant="caption" sx={{ color: color, fontWeight: 700, display: 'block', fontSize: '9px', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          EVALUACIÓN LÓGICA
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
          {data.label}
        </Typography>
      </Box>

      {/* Multiple output handles for branch options */}
      <Box sx={{ display: 'flex', flexDirection: 'column', position: 'absolute', right: -6, gap: 5, height: '100%', justifyContent: 'center' }}>
        {/* Branch THEN (SI) */}
        <Box sx={{ position: 'relative', height: 0 }}>
          <Handle
            type="source"
            position={Position.Right}
            id="then"
            style={{
              background: '#28C76F',
              width: 10,
              height: 10,
              border: '2px solid #1c2138',
              top: -12
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: 8,
              top: -18,
              color: '#28C76F',
              fontWeight: 700,
              fontSize: '8px'
            }}
          >
            SÍ
          </Typography>
        </Box>

        {/* Branch ELSE (NO) */}
        <Box sx={{ position: 'relative', height: 0 }}>
          <Handle
            type="source"
            position={Position.Right}
            id="else"
            style={{
              background: '#EA5455',
              width: 10,
              height: 10,
              border: '2px solid #1c2138',
              top: 12
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: 8,
              top: 5,
              color: '#EA5455',
              fontWeight: 700,
              fontSize: '8px'
            }}
          >
            NO
          </Typography>
        </Box>
      </Box>
    </Card>
  )
}
