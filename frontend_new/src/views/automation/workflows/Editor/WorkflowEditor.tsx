'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  Chip,
  Avatar
} from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'

import { workflowService } from '@/services/automation/workflowService'
import { Workflow, WorkflowStep } from '@/types/automation/workflowTypes'
import { TriggerNode, ActionNode, LogicNode } from './customNodes'

// Available node templates for the sidebar
interface NodePaletteItem {
  type: 'TRIGGER' | 'LOGIC' | 'ACTION';
  nodeType: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const NODE_PALETTE: NodePaletteItem[] = [
  // Triggers
  {
    type: 'TRIGGER',
    nodeType: 'contact.created',
    label: 'Prospecto Creado',
    description: 'Se activa al registrar un contacto nuevo.',
    icon: 'tabler:user-plus',
    color: '#7367F0'
  },
  {
    type: 'TRIGGER',
    nodeType: 'order.paid',
    label: 'Pedido Pagado',
    description: 'Se activa al confirmarse un pago exitoso.',
    icon: 'tabler:circle-check',
    color: '#28C76F'
  },
  {
    type: 'TRIGGER',
    nodeType: 'appointment.scheduled',
    label: 'Cita Agendada',
    description: 'Se activa al agendarse una cita comercial.',
    icon: 'tabler:calendar-event',
    color: '#00CFE8'
  },
  // Logic
  {
    type: 'LOGIC',
    nodeType: 'conditional_if',
    label: 'Evaluación IF',
    description: 'Divide el flujo con una condición SI / NO.',
    icon: 'tabler:git-branch',
    color: '#EA5455'
  },
  // Actions
  {
    type: 'ACTION',
    nodeType: 'send_whatsapp',
    label: 'Enviar WhatsApp',
    description: 'Envía un mensaje usando plantilla interactiva.',
    icon: 'tabler:brand-whatsapp',
    color: '#28C76F'
  },
  {
    type: 'ACTION',
    nodeType: 'crm_tag',
    label: 'Asignar Etiqueta',
    description: 'Asigna o desasigna etiquetas al contacto.',
    icon: 'tabler:tag',
    color: '#FF9F43'
  }
]

const nodeTypes = {
  TRIGGER: TriggerNode,
  ACTION: ActionNode,
  LOGIC: LogicNode
}

interface Props {
  isNew?: boolean;
  workflowId?: number;
}

// NOTE: styleEdge uses the active theme inside the component below

function WorkflowEditorContent({ isNew = true, workflowId }: Props) {
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useReactFlow()
  const theme = useTheme()

  // Visual edges custom style mapper using theme tokens
  const styleEdge = (params: any) => {
    const stroke = params.sourceHandle === 'then'
      ? theme.palette.success.main
      : params.sourceHandle === 'else'
      ? theme.palette.error.main
      : theme.palette.primary.main
    return {
      ...params,
      animated: true,
      style: { stroke, strokeWidth: 2 }
    }
  }

  const resolveNodeColor = (nodeType: string, groupType: string) => {
    // Prefer semantic colors by group and specific nodeType
    if (groupType === 'LOGIC') return theme.palette.error.main
    if (groupType === 'ACTION') {
      if (nodeType === 'crm_tag') return theme.palette.warning.main
      return theme.palette.success.main
    }
    // TRIGGER
    return theme.palette.primary.main
  }

  // Header & Info State
  const [name, setName] = useState('Nueva Automatización Premium')
  const [description, setDescription] = useState('Automatización interactiva creada visualmente con lienzos de arrastre.')
  const [triggerEvent, setTriggerEvent] = useState('contact.created')

  // React Flow state managed hooks
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Selection & Editor state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showVariableSuggestions, setShowVariableSuggestions] = useState(false)
  const [saving, setSaving] = useState(false)

  // Find selected node in React Flow state
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId])

  // Seed default nodes on creation
  useEffect(() => {
    if (isNew) {
      setNodes([
        {
          id: 'node_trigger',
          type: 'TRIGGER',
          position: { x: 150, y: 200 },
          data: {
            label: 'Prospecto Creado',
            color: resolveNodeColor('contact.created', 'TRIGGER'),
            icon: 'tabler:user-plus',
            type: 'TRIGGER',
            nodeType: 'contact.created',
            parameters: {}
          }
        }
      ])
    }
  }, [isNew, setNodes])

  // Load existing workflow
  useEffect(() => {
    if (isNew || !workflowId) return

    const loadWorkflow = async () => {
      try {
        const workflow = await workflowService.getWorkflowById(workflowId)
        setName(workflow.name)
        setDescription(workflow.description || '')
        setTriggerEvent(workflow.triggerEvent)

        const loadedNodes: Node[] = []
        const loadedEdges: Edge[] = []

        Object.entries(workflow.workflowSteps).forEach(([stepId, step]) => {
          let type: 'TRIGGER' | 'LOGIC' | 'ACTION' = 'ACTION'
          let nodeType = step.actionCode || ''
          
          if (step.type === 'IF') {
            type = 'LOGIC'
            nodeType = 'conditional_if'
          } else if (stepId === workflow.initialStepId) {
            type = 'TRIGGER'
            nodeType = workflow.triggerEvent
          }

          const paletteItem = NODE_PALETTE.find(p => p.nodeType === nodeType)
          const icon = paletteItem?.icon || 'tabler:circle-check'
          const color = resolveNodeColor(nodeType, type)
          const label = step.uiMetadata?.label || paletteItem?.label || 'Paso'
          
          let parameters = step.actionParameters || {}
          if (step.type === 'IF') {
            parameters = {
              field: step.condition?.field || 'type',
              operator: step.condition?.operator || 'EQUALS',
              value: step.condition?.value || ''
            }
          }

          loadedNodes.push({
            id: stepId,
            type: type,
            position: step.uiMetadata?.position || { x: 100, y: 100 },
            data: {
              label,
              color,
              icon,
              parameters,
              type,
              nodeType
            }
          })

          // Build connection edges
          if (step.type === 'IF') {
            if (step.thenStepId) {
              loadedEdges.push(styleEdge({
                id: `edge_${stepId}_then`,
                source: stepId,
                sourceHandle: 'then',
                target: step.thenStepId,
                targetHandle: 'input'
              }))
            }
            if (step.elseStepId) {
              loadedEdges.push(styleEdge({
                id: `edge_${stepId}_else`,
                source: stepId,
                sourceHandle: 'else',
                target: step.elseStepId,
                targetHandle: 'input'
              }))
            }
          } else if (step.nextStepId) {
            loadedEdges.push(styleEdge({
              id: `edge_${stepId}_output`,
              source: stepId,
              sourceHandle: 'output',
              target: step.nextStepId,
              targetHandle: 'input'
            }))
          }
        })

        setNodes(loadedNodes)
        setEdges(loadedEdges)
      } catch (err) {
        console.error('Error loading workflow:', err)
        toast.error('Error al cargar la automatización')
      }
    }

    loadWorkflow()
  }, [isNew, workflowId, setNodes, setEdges])

  // Drag and Drop from palette handling
  const handleSidebarDragStart = (e: React.DragEvent, item: NodePaletteItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      source: 'sidebar',
      type: item.type,
      nodeType: item.nodeType,
      label: item.label,
      color: item.color,
      icon: item.icon
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!reactFlowWrapper.current || !reactFlowInstance) return

      try {
        const dataStr = e.dataTransfer.getData('application/json')
        if (!dataStr) return
        
        const payload = JSON.parse(dataStr)
        if (payload.source !== 'sidebar') return

        const rect = reactFlowWrapper.current.getBoundingClientRect()
        // Convert screen client coordinates exactly into local flow canvas space
        const position = reactFlowInstance.project({
          x: e.clientX - rect.left - 110,
          y: e.clientY - rect.top - 40
        })

        const newNodeId = `node_${Date.now()}`
        const newNode: Node = {
          id: newNodeId,
          type: payload.type,
          position,
          data: {
            label: payload.label,
            color: resolveNodeColor(payload.nodeType, payload.type),
            icon: payload.icon,
            type: payload.type,
            nodeType: payload.nodeType,
            parameters: payload.nodeType === 'send_whatsapp' 
              ? { message: '¡Hola {{contact.name}}! Bienvenido a nuestra compañía.', phoneField: 'phone' }
              : payload.nodeType === 'crm_tag'
              ? { tagAction: 'ADD', tagName: '' }
              : payload.nodeType === 'conditional_if'
              ? { field: 'type', operator: 'EQUALS', value: 'LEAD' }
              : {}
          }
        }

        setNodes((nds) => nds.concat(newNode))
        setSelectedNodeId(newNodeId)
        toast.success(`Nodo ${payload.label} agregado al lienzo`)
      } catch (err) {
        console.error('Error handling drop:', err)
      }
    },
    [reactFlowInstance, setNodes]
  )

  // Standard Edge Connection Callback
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(styleEdge(params), eds))
    },
    [setEdges]
  )

  // Handle selected Node changes inside Parameter Editor
  const handleParameterChange = (key: string, value: any) => {
    if (!selectedNodeId) return
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              parameters: {
                ...n.data.parameters,
                [key]: value
              }
            }
          }
        }
        return n
      })
    )
  }

  const handleLabelChange = (value: string) => {
    if (!selectedNodeId) return
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              label: value
            }
          }
        }
        return n
      })
    )
  }

  // Type-ahead variable autocomplete trigger
  const handleTextareaKeyDown = (e: React.KeyboardEvent<any>) => {
    if (e.key === '{') {
      setShowVariableSuggestions(true)
    } else if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      setShowVariableSuggestions(false)
    }
  }

  const insertVariable = (variable: string) => {
    if (!selectedNodeId || !selectedNode) return
    const currentMsg = selectedNode.data.parameters.message || ''
    const newMsg = currentMsg.endsWith('{') 
      ? currentMsg.slice(0, -1) + `{{${variable}}}`
      : currentMsg + `{{${variable}}}`
    
    handleParameterChange('message', newMsg)
    setShowVariableSuggestions(false)
  }

  // Bidirectional controls between sidebar selects and edges state
  const handleSequentialConnectionChange = (targetId: string | null) => {
    if (!selectedNodeId) return
    setEdges(prev => {
      const filtered = prev.filter(e => !(e.source === selectedNodeId && e.sourceHandle === 'output'))
      if (targetId) {
        return [...filtered, styleEdge({
          id: `edge_${selectedNodeId}_output`,
          source: selectedNodeId,
          sourceHandle: 'output',
          target: targetId,
          targetHandle: 'input'
        })]
      }
      return filtered
    })
  }

  const handleLogicConnectionChange = (branch: 'then' | 'else', targetId: string | null) => {
    if (!selectedNodeId) return
    setEdges(prev => {
      const filtered = prev.filter(e => !(e.source === selectedNodeId && e.sourceHandle === branch))
      if (targetId) {
        return [...filtered, styleEdge({
          id: `edge_${selectedNodeId}_${branch}`,
          source: selectedNodeId,
          sourceHandle: branch,
          target: targetId,
          targetHandle: 'input'
        })]
      }
      return filtered
    })
  }

  // Deletion logic
  const handleDeleteNode = (id: string) => {
    if (id === 'node_trigger') {
      toast.error('No se puede eliminar el nodo disparador inicial')
      return
    }
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
    setSelectedNodeId(null)
    toast.success('Nodo removido del lienzo')
  }

  // Save full visual canvas logically to reactive Database
  const handleSaveWorkflow = async () => {
    try {
      setSaving(true)
      
      const triggerNode = nodes.find(n => n.type === 'TRIGGER')
      if (!triggerNode) {
        toast.error('El workflow debe contener un nodo disparador inicial')
        setSaving(false)
        return
      }

      if (nodes.length < 2) {
        toast.error('El workflow debe contener al menos un paso de lógica o acción')
        setSaving(false)
        return
      }

      const workflowSteps: Record<string, WorkflowStep> = {}
      
      nodes.forEach(n => {
        const nextEdge = edges.find(e => e.source === n.id && e.sourceHandle === 'output')
        const thenEdge = edges.find(e => e.source === n.id && e.sourceHandle === 'then')
        const elseEdge = edges.find(e => e.source === n.id && e.sourceHandle === 'else')

        const step: WorkflowStep = {
          type: (n.type === 'TRIGGER' ? 'ACTION' : (n.type === 'LOGIC' ? 'IF' : 'ACTION')) as 'IF' | 'SWITCH' | 'ACTION',
          uiMetadata: {
            position: { x: n.position.x, y: n.position.y },
            label: n.data.label
          }
        }

        if (n.data.nodeType === 'conditional_if') {
          step.type = 'IF'
          step.condition = {
            field: n.data.parameters.field || 'type',
            operator: n.data.parameters.operator || 'EQUALS',
            value: n.data.parameters.value || ''
          }
          step.thenStepId = thenEdge ? thenEdge.target : null
          step.elseStepId = elseEdge ? elseEdge.target : null
        } else {
          step.actionCode = n.data.nodeType
          step.actionParameters = n.data.parameters
          step.nextStepId = nextEdge ? nextEdge.target : null
        }

        workflowSteps[n.id] = step
      })

      const payload: Omit<Workflow, 'id' | 'tenantId' | 'companyId' | 'createdAt' | 'updatedAt'> = {
        name,
        description,
        triggerEvent: triggerNode.data.nodeType,
        cronExpression: triggerNode.data.nodeType === 'scheduler.cron' ? '0 0 * * *' : null,
        initialStepId: triggerNode.id,
        workflowSteps,
        isActive: true
      }

      if (isNew) {
        await workflowService.createWorkflow(payload)
        toast.success('Automatización creada y guardada exitosamente')
      } else if (workflowId) {
        await workflowService.updateWorkflow(workflowId, payload)
        toast.success('Automatización actualizada correctamente')
      }
      
      router.push('/automation/workflows/list')
    } catch (error: any) {
      console.error('Save error:', error)
      const message = error.response?.data?.message || error.message || 'Error al guardar la automatización'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      height="100vh" 
      sx={{ 
        overflow: 'hidden', 
        bgcolor: '#0f111a',
        color: '#fff',
        margin: '-24px'
      }}
    >
      {/* Header bar */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        px={6} 
        py={3} 
        sx={{ 
          borderBottom: '1px solid #2a2e45', 
          bgcolor: '#141824',
          zIndex: 10
        }}
      >
        <Box display="flex" alignItems="center" gap={4}>
          <IconButton onClick={() => router.push('/automation/workflows/list')} sx={{ color: '#fff', bgcolor: '#242838' }}>
            <Icon icon="tabler:arrow-left" />
          </IconButton>
          <Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Icon icon="tabler:route" style={{ color: '#7367F0' }} fontSize="1.5rem" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Visual Builder Interactivo</Typography>
             </Box>
            <Typography variant="caption" color="text.secondary">Arrastra y suelta elementos, conecta y edita parámetros en tiempo real.</Typography>
          </Box>
        </Box>
        
        <Box display="flex" gap={3}>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={() => router.push('/automation/workflows/list')}
            sx={{ borderColor: '#2d334a', color: 'text.secondary' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveWorkflow}
            disabled={saving}
            startIcon={saving ? <Icon icon="svg-spinners:180-ring" /> : <Icon icon="tabler:device-floppy" />}
            sx={{
              bgcolor: '#7367F0',
              boxShadow: '0 4px 14px 0 rgba(115, 103, 240, 0.4)',
              '&:hover': { bgcolor: '#5f53d4' }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Automatización'}
          </Button>
        </Box>
      </Box>

      {/* Main interactive area */}
      <Box display="flex" flexGrow={1} overflow="hidden">
        {/* Left Drag Palette Sidebar */}
        <Box 
          sx={{ 
            width: 320, 
            bgcolor: '#141824', 
            borderRight: '1px solid #2a2e45', 
            display: 'flex', 
            flexDirection: 'column',
            overflowY: 'auto',
            p: 5
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#7367F0', mb: 4, letterSpacing: 1 }}>
            PALETA DE COMPONENTES
          </Typography>
          
          <TextField
            fullWidth
            size="small"
            label="Nombre del Workflow"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ 
              mb: 4, 
              '& label': { color: '#a0a3b5' }, 
              '& input': { color: '#fff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#2d334a' },
                '&:hover fieldset': { borderColor: '#7367F0' }
              }
            }}
          />
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ 
              mb: 6, 
              '& label': { color: '#a0a3b5' }, 
              '& textarea': { color: '#fff' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: '#2d334a' },
                '&:hover fieldset': { borderColor: '#7367F0' }
              }
            }}
          />

          <Divider sx={{ borderColor: '#2d334a', mb: 5 }} />

          {/* Grouped Draggable node cards */}
          <Box display="flex" flexDirection="column" gap={4}>
            {/* Triggers Group */}
            <Typography variant="caption" sx={{ color: '#7367F0', fontWeight: 700 }}>TRIGGERS (Puntos de Entrada)</Typography>
            {NODE_PALETTE.filter(p => p.type === 'TRIGGER').map((item) => {
              const displayColor = resolveNodeColor(item.nodeType, item.type)
              return (
              <Card
                key={item.nodeType}
                draggable
                onDragStart={(e) => handleSidebarDragStart(e, item)}
                sx={{
                  bgcolor: '#1c2138',
                  border: `1px dashed ${theme.palette.divider}`,
                  p: 3,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: displayColor,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <Avatar sx={{ bgcolor: 'action.selected', color: displayColor, width: 32, height: 32 }}>
                  <Icon icon={item.icon} fontSize="1.1rem" />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px' }}>{item.description}</Typography>
                </Box>
              </Card>
              )
            })}

            {/* Logic Group */}
            <Typography variant="caption" sx={{ color: '#EA5455', fontWeight: 700, mt: 3 }}>LÓGICA (Evaluaciones)</Typography>
            {NODE_PALETTE.filter(p => p.type === 'LOGIC').map((item) => {
              const displayColor = resolveNodeColor(item.nodeType, item.type)
              return (
              <Card
                key={item.nodeType}
                draggable
                onDragStart={(e) => handleSidebarDragStart(e, item)}
                sx={{
                  bgcolor: '#1c2138',
                  border: `1px dashed ${theme.palette.divider}`,
                  p: 3,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: displayColor,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <Avatar sx={{ bgcolor: 'action.selected', color: displayColor, width: 32, height: 32 }}>
                  <Icon icon={item.icon} fontSize="1.1rem" />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px' }}>{item.description}</Typography>
                </Box>
              </Card>
              )
            })}

            {/* Actions Group */}
            <Typography variant="caption" sx={{ color: '#28C76F', fontWeight: 700, mt: 3 }}>ACCIONES (Ejecuciones)</Typography>
            {NODE_PALETTE.filter(p => p.type === 'ACTION').map((item) => {
              const displayColor = resolveNodeColor(item.nodeType, item.type)
              return (
              <Card
                key={item.nodeType}
                draggable
                onDragStart={(e) => handleSidebarDragStart(e, item)}
                sx={{
                  bgcolor: '#1c2138',
                  border: `1px dashed ${theme.palette.divider}`,
                  p: 3,
                  cursor: 'grab',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: displayColor,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }
                }}
              >
                <Avatar sx={{ bgcolor: 'action.selected', color: displayColor, width: 32, height: 32 }}>
                  <Icon icon={item.icon} fontSize="1.1rem" />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px' }}>{item.description}</Typography>
                </Box>
              </Card>
              )
            })}
          </Box>
        </Box>

        {/* Central Canvas Zone */}
        <Box 
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
          sx={{ 
            flexGrow: 1, 
            position: 'relative',
            height: '100%',
            bgcolor: '#0a0c14'
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#2a2e45" />
            <Controls 
              style={{
                background: '#141824cc',
                border: '1px solid #2a2e45',
                borderRadius: '8px',
                padding: '4px'
              }}
            />
            <MiniMap 
              nodeColor={(node) => (node.data?.color || '#7367F0')}
              maskColor="rgba(10, 12, 20, 0.7)"
              style={{
                background: '#141824cc',
                border: '1px solid #2a2e45',
                borderRadius: '8px',
              }}
            />
          </ReactFlow>
        </Box>
      </Box>

      {/* Right Drawer Slide-over Property Editor */}
      <Drawer
        anchor="right"
        open={!!selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
        PaperProps={{
          sx: { 
            width: 380, 
            bgcolor: '#141824', 
            color: '#fff',
            borderLeft: '1px solid #2a2e45',
            p: 6
          }
        }}
      >
        {selectedNode ? (
          <Box display="flex" flexDirection="column" gap={5}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: `${selectedNode.data.color}15`, color: selectedNode.data.color }}>
                  <Icon icon={selectedNode.data.icon} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Ajustar Parámetros</Typography>
              </Box>
              <IconButton onClick={() => setSelectedNodeId(null)} sx={{ color: '#fff' }}>
                <Icon icon="tabler:x" />
              </IconButton>
            </Box>

            <Divider sx={{ borderColor: '#2a2e45' }} />

            {/* General Title field */}
            <TextField
              fullWidth
              size="small"
              label="Nombre del Paso"
              value={selectedNode.data.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              sx={{ 
                '& label': { color: '#a0a3b5' }, 
                '& input': { color: '#fff' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#2d334a' },
                  '&:hover fieldset': { borderColor: '#7367F0' }
                }
              }}
            />

            {/* Node type specific custom inputs */}
            {selectedNode.data.nodeType === 'send_whatsapp' && (
              <Box display="flex" flexDirection="column" gap={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#a0a3b5' }}>Campo Destinatario</InputLabel>
                  <Select
                    value={selectedNode.data.parameters.phoneField || 'phone'}
                    label="Campo Destinatario"
                    onChange={(e) => handleParameterChange('phoneField', e.target.value)}
                    sx={{ 
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2d334a' }
                    }}
                  >
                    <MenuItem value="phone">Teléfono Móvil (phone)</MenuItem>
                    <MenuItem value="custom">Número Manual</MenuItem>
                  </Select>
                </FormControl>

                {/* Message body with Autosuggest Variable Trigger */}
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    rows={4}
                    label="Mensaje WhatsApp"
                    placeholder="Escribe el mensaje. Presiona '{' para variables..."
                    value={selectedNode.data.parameters.message || ''}
                    onKeyDown={handleTextareaKeyDown}
                    onChange={(e) => handleParameterChange('message', e.target.value)}
                    sx={{ 
                      '& label': { color: '#a0a3b5' }, 
                      '& textarea': { color: '#fff' },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#2d334a' },
                        '&:hover fieldset': { borderColor: '#7367F0' }
                      }
                    }}
                  />
                  {showVariableSuggestions && (
                    <Paper 
                      sx={{ 
                        position: 'absolute', 
                        bottom: '100%', 
                        left: 0, 
                        width: '100%', 
                        zIndex: 20, 
                        bgcolor: '#1c2138', 
                        border: '1px solid #7367F0', 
                        boxShadow: 5,
                        maxHeight: 150,
                        overflowY: 'auto'
                      }}
                    >
                      <Box p={2} sx={{ bgcolor: '#7367F015', borderBottom: '1px solid #7367F044' }}>
                        <Typography variant="caption" sx={{ color: '#7367F0', fontWeight: 600 }}>Variables del Sistema</Typography>
                      </Box>
                      {['contact.name', 'contact.email', 'contact.phone', 'activeCompany.name', 'activeUser.name'].map(v => (
                        <MenuItem 
                          key={v} 
                          onClick={() => insertVariable(v)}
                          sx={{ color: '#fff', fontSize: '12px', '&:hover': { bgcolor: '#7367F033' } }}
                        >
                          {`{${v}}`}
                        </MenuItem>
                      ))}
                    </Paper>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Escribe <strong style={{ color: '#7367F0' }}>{"{"}</strong> para desplegar la lista flotante de variables predictivas.
                </Typography>
              </Box>
            )}

            {selectedNode.data.nodeType === 'crm_tag' && (
              <Box display="flex" flexDirection="column" gap={4}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#a0a3b5' }}>Acción</InputLabel>
                  <Select
                    value={selectedNode.data.parameters.tagAction || 'ADD'}
                    label="Acción"
                    onChange={(e) => handleParameterChange('tagAction', e.target.value)}
                    sx={{ 
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2d334a' }
                    }}
                  >
                    <MenuItem value="ADD">Asignar Etiqueta (Tag)</MenuItem>
                    <MenuItem value="REMOVE">Quitar Etiqueta (Tag)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Nombre de Etiqueta"
                  placeholder="Ej: Cliente VIP"
                  value={selectedNode.data.parameters.tagName || ''}
                  onChange={(e) => handleParameterChange('tagName', e.target.value)}
                  sx={{ 
                    '& label': { color: '#a0a3b5' }, 
                    '& input': { color: '#fff' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#2d334a' },
                      '&:hover fieldset': { borderColor: '#7367F0' }
                    }
                  }}
                />
              </Box>
            )}

            {selectedNode.data.nodeType === 'conditional_if' && (
              <Box display="flex" flexDirection="column" gap={4}>
                <Typography variant="caption" sx={{ color: '#EA5455', fontWeight: 700 }}>CONDICIÓN (IF)</Typography>
                
                <TextField
                  fullWidth
                  size="small"
                  label="Campo a Evaluar"
                  value={selectedNode.data.parameters.field || 'type'}
                  onChange={(e) => handleParameterChange('field', e.target.value)}
                  sx={{ 
                    '& label': { color: '#a0a3b5' }, 
                    '& input': { color: '#fff' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#2d334a' }
                    }
                  }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#a0a3b5' }}>Operador</InputLabel>
                  <Select
                    value={selectedNode.data.parameters.operator || 'EQUALS'}
                    label="Operador"
                    onChange={(e) => handleParameterChange('operator', e.target.value)}
                    sx={{ 
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2d334a' }
                    }}
                  >
                    <MenuItem value="EQUALS">Es Igual a (EQUALS)</MenuItem>
                    <MenuItem value="NOT_EQUALS">No es Igual a (NOT_EQUALS)</MenuItem>
                    <MenuItem value="CONTAINS">Contiene (CONTAINS)</MenuItem>
                    <MenuItem value="GREATER_THAN">Mayor que (GREATER_THAN)</MenuItem>
                    <MenuItem value="LESS_THAN">Menor que (LESS_THAN)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Valor Comparación"
                  value={selectedNode.data.parameters.value || 'LEAD'}
                  onChange={(e) => handleParameterChange('value', e.target.value)}
                  sx={{ 
                    '& label': { color: '#a0a3b5' }, 
                    '& input': { color: '#fff' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: '#2d334a' }
                    }
                  }}
                />

                <Divider sx={{ borderColor: '#2a2e45', my: 2 }} />

                <Typography variant="caption" sx={{ color: '#a0a3b5', fontWeight: 600 }}>Enlace de Ramas:</Typography>
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#a0a3b5' }}>Si se cumple (SI / Then)</InputLabel>
                  <Select
                    value={edges.find(e => e.source === selectedNodeId && e.sourceHandle === 'then')?.target || ''}
                    label="Si se cumple (SI / Then)"
                    onChange={(e) => handleLogicConnectionChange('then', e.target.value || null)}
                    sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2d334a' } }}
                  >
                    <MenuItem value=""><em>Desconectado</em></MenuItem>
                    {nodes.filter(n => n.id !== selectedNodeId).map(n => (
                      <MenuItem key={n.id} value={n.id}>{n.data.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#a0a3b5' }}>Si no se cumple (NO / Else)</InputLabel>
                  <Select
                    value={edges.find(e => e.source === selectedNodeId && e.sourceHandle === 'else')?.target || ''}
                    label="Si no se cumple (NO / Else)"
                    onChange={(e) => handleLogicConnectionChange('else', e.target.value || null)}
                    sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2d334a' } }}
                  >
                    <MenuItem value=""><em>Desconectado</em></MenuItem>
                    {nodes.filter(n => n.id !== selectedNodeId).map(n => (
                      <MenuItem key={n.id} value={n.id}>{n.data.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Standard linear connection linker */}
            {selectedNode.data.type !== 'LOGIC' && selectedNode.id !== 'node_trigger' && (
              <Box display="flex" flexDirection="column" gap={4}>
                <Divider sx={{ borderColor: '#2a2e45' }} />
                <Typography variant="caption" sx={{ color: '#a0a3b5', fontWeight: 600 }}>Enlace secuencial:</Typography>
                
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#a0a3b5' }}>Siguiente Paso</InputLabel>
                  <Select
                    value={edges.find(e => e.source === selectedNodeId && e.sourceHandle === 'output')?.target || ''}
                    label="Siguiente Paso"
                    onChange={(e) => handleSequentialConnectionChange(e.target.value || null)}
                    sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2d334a' } }}
                  >
                    <MenuItem value=""><em>Desconectado</em></MenuItem>
                    {nodes.filter(n => n.id !== selectedNodeId && n.type !== 'TRIGGER').map(n => (
                      <MenuItem key={n.id} value={n.id}>{n.data.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <Button
              variant="contained"
              color="error"
              startIcon={<Icon icon="tabler:trash" />}
              onClick={() => handleDeleteNode(selectedNode.id)}
              disabled={selectedNode.id === 'node_trigger'}
              sx={{ mt: 5 }}
            >
              Eliminar Nodo
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Typography variant="body1">Selecciona un nodo para editar</Typography>
          </Box>
        )}
      </Drawer>

      {/* Global premium dyna mic style injections */}
      <style jsx global>{`
        .react-flow__edge-path {
          stroke-linecap: round;
        }
        .react-flow__edge.animated path {
          stroke-dasharray: 6;
          animation: react-flow__dashanim 0.8s linear infinite;
        }
        @keyframes react-flow__dashanim {
          from {
            stroke-dashoffset: 12;
          }
        }
        .react-flow__handle {
          transition: all 0.2s ease;
        }
        .react-flow__handle:hover {
          transform: scale(1.3);
          box-shadow: 0 0 10px rgba(255,255,255,0.8);
        }
      `}</style>
    </Box>
  )
}

export default function WorkflowEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent {...props} />
    </ReactFlowProvider>
  )
}
