'use client'

import React, { useState, useEffect } from 'react'
import { Box, Grid, Typography, CircularProgress, Alert, Paper, IconButton, TextField, Select, MenuItem, FormControl, InputLabel, InputAdornment, FormControlLabel, Switch } from '@mui/material'
import PipelineKanbanCard from './PipelineKanbanCard'
import AddProspectDialog from './AddProspectDialog'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Pipeline, PipelineKanbanCard as PipelineKanbanCardType } from '@/types/marketing/pipelineTypes'
import { Icon } from '@iconify/react'

interface Props {
  pipelineId: number
}

export default function PipelineKanbanBoard({ pipelineId }: Props) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [boardData, setBoardData] = useState<Record<string, PipelineKanbanCardType[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [isAddProspectOpen, setIsAddProspectOpen] = useState(false)
  const [activeStageId, setActiveStageId] = useState<number | null>(null)

  // Visual feedback states
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null)
  const [errorCardId, setErrorCardId] = useState<string | null>(null)

  useEffect(() => {
    loadKanban()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId])

  const loadKanban = async () => {
    try {
      setLoading(true)
      const [pipelineData, kanbanData] = await Promise.all([
        pipelineService.getPipelineById(pipelineId),
        pipelineService.getKanbanData(pipelineId)
      ])
      setPipeline(pipelineData)
      setBoardData(kanbanData || {})
      setError(null)
    } catch (err: any) {
      setError('Error al cargar el Kanban: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, card: PipelineKanbanCardType) => {
    e.dataTransfer.setData('conversationId', card.conversationId)
    e.dataTransfer.setData('currentStage', card.stage)
    e.dataTransfer.setData('contactId', String(card.contactId || ''))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() 
  }

  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault()
    const conversationId = e.dataTransfer.getData('conversationId')
    const currentStageId = e.dataTransfer.getData('currentStage')
    const contactIdStr = e.dataTransfer.getData('contactId')

    if (currentStageId === newStageId) return 

    try {
      setUpdatingCardId(conversationId)

      await pipelineService.moveConversation(conversationId, {
        contactId: contactIdStr ? parseInt(contactIdStr) : undefined,
        conversationId,
        toStageId: parseInt(newStageId),
        reason: 'Drag and Drop en Kanban'
      })

      await loadKanban()
    } catch (err) {
      setErrorCardId(conversationId)
      setTimeout(() => {
        setErrorCardId(null)
      }, 2000)
    } finally {
      setUpdatingCardId(null)
    }
  }

  const handleAddProspect = (stageId: number) => {
    setActiveStageId(stageId)
    setIsAddProspectOpen(true)
  }

  const [searchFilter, setSearchFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [unreadFilter, setUnreadFilter] = useState(false)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !pipeline) {
    return <Alert severity="error">{error || 'Pipeline no encontrado'}</Alert>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap', alignItems: 'center', bgcolor: 'background.paper', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <TextField
          size="small"
          placeholder="Buscar prospecto o ID..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="tabler:search" fontSize={20} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="priority-filter-label">Prioridad</InputLabel>
          <Select
            labelId="priority-filter-label"
            value={priorityFilter}
            label="Prioridad"
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <MenuItem value="ALL">Todas</MenuItem>
            <MenuItem value="URGENT">Urgente</MenuItem>
            <MenuItem value="HIGH">Alta</MenuItem>
            <MenuItem value="MEDIUM">Media</MenuItem>
            <MenuItem value="LOW">Baja</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Switch 
              checked={unreadFilter}
              onChange={(e) => setUnreadFilter(e.target.checked)}
              color="primary"
            />
          }
          label="Solo no leídos"
        />
      </Box>
      <Grid container spacing={3} sx={{ overflowX: 'auto', flexWrap: 'nowrap', pb: 2 }}>
        {pipeline.stages?.map((stage) => {
          let stageCards = boardData[String(stage.id)] || []
          
          if (searchFilter) {
            stageCards = stageCards.filter(c => 
              c.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
              String(c.conversationId).toLowerCase().includes(searchFilter.toLowerCase())
            )
          }
          if (priorityFilter !== 'ALL') {
            stageCards = stageCards.filter(c => c.priority === priorityFilter)
          }
          // Note: Unread filter requires backend support for unreadCount, skipped for now or mocked.

          const columnKey = `stage-${stage.id}-${stageCards.length}`

        return (
          <Grid item xs={12} md={4} lg={3} key={columnKey} sx={{ minWidth: 320, maxWidth: 400 }}>
            <Paper
              elevation={0}
              sx={{
                borderTop: `4px solid ${stage.color || '#10B981'}`,
                bgcolor: 'background.default',
                borderRadius: 2,
                height: '100%',
                minHeight: '70vh',
                display: 'flex',
                flexDirection: 'column'
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, String(stage.id))}
            >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {stage.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ bgcolor: 'action.hover', px: 1, borderRadius: 1 }}>
                    {stageCards.length}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={() => handleAddProspect(stage.id)} color="primary">
                    <Icon icon="tabler:plus" />
                </IconButton>
              </Box>

              <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                {stageCards.map((card) => {
                  const isUpdating = updatingCardId === card.conversationId
                  const isError = errorCardId === card.conversationId

                  return (
                    <Box
                      key={card.conversationId}
                      draggable={!isUpdating}
                      onDragStart={(e) => handleDragStart(e, card)}
                    >
                      <PipelineKanbanCard
                        card={card}
                        isUpdating={isUpdating}
                        isError={isError}
                        borderColor={isUpdating ? stage.color : 'transparent'}
                      />
                    </Box>
                  )
                })}

                {stageCards.length === 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100 }}>
                    <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ borderStyle: 'dashed', borderWidth: 1, borderColor: 'divider', p: 2, borderRadius: 1, width: '100%', textAlign: 'center' }}
                    >
                      Arrastra una tarjeta aquí
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        )
      })}
      
      {activeStageId && (
        <AddProspectDialog 
          open={isAddProspectOpen}
          onClose={() => setIsAddProspectOpen(false)}
          pipelineId={pipelineId}
          targetStageId={activeStageId}
          onSuccess={loadKanban}
        />
      )}
    </Grid>
  </Box>
  )
}
