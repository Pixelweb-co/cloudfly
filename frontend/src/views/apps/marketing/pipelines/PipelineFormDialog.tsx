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
import { pipelineApi } from '@/api/marketing/pipelineApi'
import { Pipeline, PipelineType } from '@/types/marketing/pipelineTypes'

interface Props {
  open: boolean
  pipeline: Pipeline | null
  onClose: () => void
  onSave: () => void
}

export default function PipelineFormDialog({ open, pipeline, onClose, onSave }: Props) {
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
        type: pipeline.type,
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
        // En una app real, aquí iría pipelineApi.updatePipeline(pipeline.id, formData)
        // Para simplificar, asumimos que createPipeline hace upsert o solo creamos nuevos.
        console.warn('Update pipeline not fully implemented in API yet')
      } else {
        await pipelineApi.createPipeline({
          ...formData,
          isDefault: false,
          icon: 'tabler-layout-kanban',
          stages: [
            { name: 'Lead', description: 'Nuevo prospecto', color: '#9CA3AF', position: 0, isInitial: true, isFinal: false, outcome: 'OPEN' },
            { name: 'En Proceso', description: 'Contactado', color: '#3B82F6', position: 1, isInitial: false, isFinal: false, outcome: 'OPEN' },
            { name: 'Cerrado', description: 'Venta', color: '#10B981', position: 2, isInitial: false, isFinal: true, outcome: 'WON' }
          ]
        })
      }
      onSave()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{pipeline ? 'Editar Embudo' : 'Nuevo Embudo'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
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
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Se crearán 3 etapas por defecto iniciales (Lead, En Proceso, Cerrado). Podrás modificarlas más adelante.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={loading || !formData.name}>
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
