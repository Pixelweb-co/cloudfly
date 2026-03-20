'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  Typography
} from '@mui/material'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Pipeline, PipelineType } from '@/types/marketing/pipelineTypes'

interface Props {
  open: boolean
  pipeline: Pipeline | null
  onClose: () => void
  onSuccess: () => void
}

export default function PipelineFormDialog({ open, pipeline, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CUSTOM' as PipelineType,
    color: '#6366F1'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pipeline) {
      setFormData({
        name: pipeline.name,
        description: pipeline.description || '',
        type: pipeline.type as PipelineType,
        color: pipeline.color || '#6366F1'
      })
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'CUSTOM',
        color: '#6366F1'
      })
    }
  }, [pipeline, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (pipeline) {
        await pipelineService.updatePipeline(pipeline.id, formData)
      } else {
        await pipelineService.createPipeline({
          ...formData,
          isActive: true,
          isDefault: false
        })
      }
      onSuccess()
      onClose()
    } catch (e) {
      console.error('Error al guardar pipeline:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{pipeline ? 'Editar Embudo' : 'Nuevo Embudo'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Nombre del Embudo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PipelineType })}
              >
                <MenuItem value="SALES">Ventas</MenuItem>
                <MenuItem value="SUPPORT">Soporte</MenuItem>
                <MenuItem value="MARKETING">Marketing</MenuItem>
                <MenuItem value="CUSTOM">Personalizado</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Color Hexadecimal"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </Grid>
          </Grid>
          {!pipeline && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 4, display: 'block' }}>
              Se crearán etapas por defecto iniciales. Podrás modificarlas más adelante.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 5 }}>
          <Button onClick={onClose} disabled={loading} color="secondary">Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading || !formData.name}>
            {loading ? <CircularProgress size={20} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
