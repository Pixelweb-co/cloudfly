import React, { useState } from 'react'
import { Grid, Typography } from '@mui/material'
import PipelineListTable from '@/views/apps/marketing/pipelines/PipelineListTable'
import PipelineFormDialog from '@/views/apps/marketing/pipelines/PipelineFormDialog'
import { Pipeline } from '@/types/marketing/pipelineTypes'

export default function PipelinesListPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  
  // Trick to force list re-render
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEdit = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditingPipeline(null)
    setFormOpen(true)
  }

  const handleSave = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Gestión de Embudos
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Administra los pipelines de ventas, atención y marketing de tu empresa.
        </Typography>

        <PipelineListTable 
          key={refreshKey}
          onEdit={handleEdit} 
          onAdd={handleAdd} 
        />

        <PipelineFormDialog
          open={formOpen}
          pipeline={editingPipeline}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      </Grid>
    </Grid>
  )
}
