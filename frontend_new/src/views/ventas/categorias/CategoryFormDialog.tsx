'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  CircularProgress
} from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { Icon } from '@iconify/react'
import { categoryService } from '@/services/ventas/categoryService'
import { CategoryType as Category } from '@/types/apps/categoryType'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  category: Category | null
  onSaved: () => void
}

export default function CategoryFormDialog({ open, onClose, category, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Category>>({
    nombreCategoria: '',
    description: '',
    status: true
  })

  useEffect(() => {
    if (category) {
      setFormData(category)
    } else {
      setFormData({
        nombreCategoria: '',
        description: '',
        status: true
      })
    }
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (category?.id) {
        await categoryService.updateCategory(category.id, formData)
        toast.success('Categoría actualizada')
      } else {
        await categoryService.createCategory(formData)
        toast.success('Categoría creada exitosamente')
      }
      onSaved()
      onClose()
    } catch (e) {
      console.error('Error saving category:', e)
      toast.error('Error al guardar la categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        <Icon 
          icon={category ? "tabler:edit" : "tabler:plus"} 
          fontSize={24} 
          color={category ? "info.main" : "primary.main"} 
        />
        <Typography variant="h6">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                label="Nombre de la Categoría"
                placeholder="Ej: Electrónica, Servicios, etc."
                value={formData.nombreCategoria}
                onChange={e => setFormData({ ...formData, nombreCategoria: e.target.value })}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                multiline
                rows={4}
                label="Descripción (Opcional)"
                placeholder="Detalles sobre los productos de esta categoría..."
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 5 }}>
          <Button onClick={onClose} color="secondary" variant="outlined">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Icon icon="tabler:device-floppy" />}
          >
            {loading ? 'Guardando...' : 'Guardar Categoría'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
