'use client'

import React, { useState, useEffect } from 'react'
import { Box, Grid, Typography, CircularProgress, Alert, Paper } from '@mui/material'
import PipelineKanbanCard from './PipelineKanbanCard'
import { pipelineApi } from '@/api/marketing/pipelineApi'
import { Pipeline, PipelineKanbanCard as PipelineKanbanCardType } from '@/types/marketing/pipelineTypes'

interface Props {
  pipelineId: number
}

export default function PipelineKanbanBoard({ pipelineId }: Props) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [boardData, setBoardData] = useState<Record<string, PipelineKanbanCardType[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Visual feedback states exactly as defined in walkthrough
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null)
  const [errorCardId, setErrorCardId] = useState<string | null>(null)

  useEffect(() => {
    loadKanban()
  }, [pipelineId])

  const loadKanban = async () => {
    try {
      setLoading(true)
      const [pipelineData, kanbanData] = await Promise.all([
        pipelineApi.getPipelineById(pipelineId),
        pipelineApi.getKanbanData(pipelineId)
      ])
      setPipeline(pipelineData)
      setBoardData(kanbanData)
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
    e.preventDefault() // Required to allow drop
  }

  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault()
    const conversationId = e.dataTransfer.getData('conversationId')
    const currentStageId = e.dataTransfer.getData('currentStage')
    const contactIdStr = e.dataTransfer.getData('contactId')

    if (currentStageId === newStageId) return // No change

    try {
      setUpdatingCardId(conversationId)

      await pipelineApi.moveConversation(conversationId, {
        contactId: contactIdStr ? parseInt(contactIdStr) : undefined,
        conversationId,
        toStageId: parseInt(newStageId),
        reason: 'Drag and Drop en Kanban'
      })

      // Success
      await loadKanban()
    } catch (err) {
      // Error Flow
      setErrorCardId(conversationId)
      setTimeout(() => {
        setErrorCardId(null)
      }, 2000)
    } finally {
      setUpdatingCardId(null)
    }
  }

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
    <Grid container spacing={3} sx={{ overflowX: 'auto', flexWrap: 'nowrap', pb: 2 }}>
      {pipeline.stages?.map((stage) => {
        const stageCards = boardData[String(stage.id)] || []
        // Using stage.id + cards length as a key trick mentioned in walkthrough for sync
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
              {/* Header */}
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {stage.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ bgcolor: 'action.hover', px: 1, borderRadius: 1 }}>
                  {stageCards.length}
                </Typography>
              </Box>

              {/* Cards Container */}
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
                    <Typography variant="body2" color="text.secondary" sx={{ borderStyle: 'dashed', borderWidth: 1, borderColor: 'divider', p: 2, borderRadius: 1, width: '100%', textAlign: 'center' }}>
                      Arrastra una tarjeta aquí
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  )
}
