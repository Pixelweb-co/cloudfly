'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { Icon } from '@iconify/react'
import { useSearchParams, useRouter } from 'next/navigation'
import PipelineKanbanBoard from '@/views/apps/marketing/pipelines/PipelineKanbanBoard'

function KanbanContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const idParam = searchParams.get('id')
  
  const [pipelineId, setPipelineId] = useState<number | null>(idParam ? parseInt(idParam) : null)

  useEffect(() => {
    if (idParam) {
      setPipelineId(parseInt(idParam))
    }
  }, [idParam])

  if (!pipelineId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          No se ha seleccionado ningún embudo.
        </Typography>
        <Button variant="contained" onClick={() => router.push('/marketing/pipelines/list')}>
          Ir a lista de embudos
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Tablero Kanban
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<Icon icon="tabler-arrow-left" />}
          onClick={() => router.push('/marketing/pipelines/list')}
        >
          Volver a Lista
        </Button>
      </Box>
      
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <PipelineKanbanBoard pipelineId={pipelineId} />
      </Box>
    </Box>
  )
}

export default function PipelineKanbanPage() {
  return (
    <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}>
      <KanbanContent />
    </Suspense>
  )
}
