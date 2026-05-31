/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import LiveAgentCard from '@/views/marketing/ai-operation/LiveAgentCard'
import AgentFlowGraph from '@/views/marketing/ai-operation/AgentFlowGraph'
import MarketingHistoryTimeline from '@/views/marketing/ai-operation/MarketingHistoryTimeline'
import type { MarketingAgent, AgentConnection, MarketingActionEvent } from '@/types/marketing/aiMarketing'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockWorkingAgent: MarketingAgent = {
  id: 'agent-1',
  name: 'Campaign Bot',
  status: 'working',
  currentTask: 'Enviando campaña de email',
  lastActivity: '2025-06-15T10:30:00Z'
}

const mockIdleAgent: MarketingAgent = {
  id: 'agent-2',
  name: 'Lead Qualifier',
  status: 'idle',
  currentTask: '',
  lastActivity: '2025-06-15T09:00:00Z'
}

const mockWaitingAgent: MarketingAgent = {
  id: 'agent-3',
  name: 'Social Media Agent',
  status: 'waiting',
  currentTask: 'Esperando aprobación de contenido',
  lastActivity: '2025-06-15T10:15:00Z'
}

const mockErrorAgent: MarketingAgent = {
  id: 'agent-4',
  name: 'Analytics Reporter',
  status: 'error',
  currentTask: 'Error al generar reporte',
  lastActivity: '2025-06-15T10:00:00Z'
}

const mockConnections: AgentConnection[] = [
  { from: 'agent-1', to: 'agent-2', label: 'Leads' },
  { from: 'agent-2', to: 'agent-3', label: 'Contenido' }
]

const mockEvents: MarketingActionEvent[] = [
  {
    id: 'evt-1',
    agentId: 'agent-1',
    agentName: 'Campaign Bot',
    actionType: 'CAMPAIGN_SENT',
    description: 'Campaña "Verano 2025" enviada a 1,200 contactos',
    timestamp: '2025-06-15T10:30:00Z'
  },
  {
    id: 'evt-2',
    agentId: 'agent-2',
    agentName: 'Lead Qualifier',
    actionType: 'LEAD_QUALIFIED',
    description: 'Nuevo lead calificado: Empresa ABC',
    timestamp: '2025-06-15T10:25:00Z'
  },
  {
    id: 'evt-3',
    agentId: 'agent-4',
    agentName: 'Analytics Reporter',
    actionType: 'ERROR',
    description: 'Timeout al conectar con Google Analytics',
    timestamp: '2025-06-15T10:00:00Z'
  }
]

// ---------------------------------------------------------------------------
// LiveAgentCard Tests
// ---------------------------------------------------------------------------

describe('LiveAgentCard', () => {
  it('renders agent name correctly', () => {
    render(<LiveAgentCard agent={mockWorkingAgent} />)
    expect(screen.getByText('Campaign Bot')).toBeInTheDocument()
  })

  it('renders working status chip with correct label', () => {
    render(<LiveAgentCard agent={mockWorkingAgent} />)
    expect(screen.getByText('Trabajando')).toBeInTheDocument()
  })

  it('renders idle status chip', () => {
    render(<LiveAgentCard agent={mockIdleAgent} />)
    expect(screen.getByText('En espera')).toBeInTheDocument()
  })

  it('renders waiting status chip', () => {
    render(<LiveAgentCard agent={mockWaitingAgent} />)
    expect(screen.getByText('Esperando')).toBeInTheDocument()
  })

  it('renders error status chip', () => {
    render(<LiveAgentCard agent={mockErrorAgent} />)
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders current task for working agent', () => {
    render(<LiveAgentCard agent={mockWorkingAgent} />)
    expect(screen.getByText('Enviando campaña de email')).toBeInTheDocument()
  })

  it('renders fallback text when no task is assigned', () => {
    render(<LiveAgentCard agent={mockIdleAgent} />)
    expect(screen.getByText('Sin tarea asignada')).toBeInTheDocument()
  })

  it('renders last activity time', () => {
    render(<LiveAgentCard agent={mockWorkingAgent} />)
    // The time will be formatted, so we just check the label exists
    expect(screen.getByText(/Última actividad:/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AgentFlowGraph Tests
// ---------------------------------------------------------------------------

describe('AgentFlowGraph', () => {
  it('renders without crashing with agents and connections', () => {
    const { container } = render(
      <AgentFlowGraph
        agents={[mockWorkingAgent, mockIdleAgent]}
        connections={mockConnections}
      />
    )
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders agent names in the SVG', () => {
    const { container } = render(
      <AgentFlowGraph
        agents={[mockWorkingAgent, mockIdleAgent]}
        connections={mockConnections}
      />
    )
    expect(container.textContent).toContain('Campaign Bot')
    expect(container.textContent).toContain('Lead Qualifier')
  })

  it('renders empty state when no agents', () => {
    render(<AgentFlowGraph agents={[]} connections={[]} />)
    expect(screen.getByText('No hay agentes para mostrar')).toBeInTheDocument()
  })

  it('renders connection labels', () => {
    const { container } = render(
      <AgentFlowGraph
        agents={[mockWorkingAgent, mockIdleAgent]}
        connections={mockConnections}
      />
    )
    expect(container.textContent).toContain('Leads')
  })
})

// ---------------------------------------------------------------------------
// MarketingHistoryTimeline Tests
// ---------------------------------------------------------------------------

describe('MarketingHistoryTimeline', () => {
  it('renders without crashing with events', () => {
    render(<MarketingHistoryTimeline events={mockEvents} />)
    expect(screen.getByText('Campaign Bot')).toBeInTheDocument()
  })

  it('renders event descriptions', () => {
    render(<MarketingHistoryTimeline events={mockEvents} />)
    expect(screen.getByText('Campaña "Verano 2025" enviada a 1,200 contactos')).toBeInTheDocument()
    expect(screen.getByText('Nuevo lead calificado: Empresa ABC')).toBeInTheDocument()
    expect(screen.getByText('Timeout al conectar con Google Analytics')).toBeInTheDocument()
  })

  it('renders action type chips', () => {
    render(<MarketingHistoryTimeline events={mockEvents} />)
    expect(screen.getByText('Campaña enviada')).toBeInTheDocument()
    expect(screen.getByText('Lead calificado')).toBeInTheDocument()
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders empty state when no events', () => {
    render(<MarketingHistoryTimeline events={[]} />)
    expect(screen.getByText('No hay eventos recientes')).toBeInTheDocument()
  })

  it('renders event count in header', () => {
    render(<MarketingHistoryTimeline events={mockEvents} />)
    expect(screen.getByText('Historial de Acciones (3)')).toBeInTheDocument()
  })

  it('renders agent names', () => {
    render(<MarketingHistoryTimeline events={mockEvents} />)
    expect(screen.getByText('Campaign Bot')).toBeInTheDocument()
    expect(screen.getByText('Lead Qualifier')).toBeInTheDocument()
    expect(screen.getByText('Analytics Reporter')).toBeInTheDocument()
  })
})
