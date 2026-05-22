'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Divider
} from '@mui/material'
import { Icon } from '@iconify/react'
import { tagService } from '@/services/marketing/tagService'
import { Tag } from '@/types/marketing/contactTypes'
import toast from 'react-hot-toast'

interface Props {
  open: boolean;
  onClose: () => void;
  onTagsUpdated?: () => void;
}

// Curated vibrant HSL colors as Hex presets
const COLOR_PRESETS = [
  { hex: '#7367F0', name: 'Violeta CloudFly' },
  { hex: '#28C76F', name: 'Esmeralda' },
  { hex: '#FF9F43', name: 'Ámbar' },
  { hex: '#EA5455', name: 'Coral' },
  { hex: '#00CFE8', name: 'Cian Claro' },
  { hex: '#1E90FF', name: 'Azul Dodger' },
  { hex: '#9C27B0', name: 'Púrpura' },
  { hex: '#FF4081', name: 'Rosa' }
]

export default function TagManagementModal({ open, onClose, onTagsUpdated }: Props) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState('#7367F0')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadTags()
    }
  }, [open])

  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await tagService.getAllTags()
      setTags(data || [])
    } catch (e: any) {
      console.error('Error cargando etiquetas:', e)
      toast.error('Error al cargar las etiquetas de la compañía')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('El nombre de la etiqueta no puede estar vacío')
      return
    }

    try {
      setSaving(true)
      if (editingTag) {
        // Update tag
        await tagService.updateTag(editingTag.id, { name: trimmedName, color: selectedColor })
        toast.success('Etiqueta actualizada correctamente')
      } else {
        // Create tag
        await tagService.createTag({ name: trimmedName, color: selectedColor })
        toast.success('Etiqueta creada exitosamente')
      }
      
      // Reset form
      setName('')
      setSelectedColor('#7367F0')
      setEditingTag(null)
      
      // Reload tags and notify parent
      await loadTags()
      if (onTagsUpdated) onTagsUpdated()
    } catch (error: any) {
      console.error('Error guardando etiqueta:', error)
      const message = error.response?.data?.message || error.message || 'Error al guardar la etiqueta'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag)
    setName(tag.name)
    setSelectedColor(tag.color || '#7367F0')
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    setName('')
    setSelectedColor('#7367F0')
  }

  const handleDeleteClick = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta etiqueta? Esto la desasociará de todos los contactos asociados.')) return
    
    try {
      setSaving(true)
      await tagService.deleteTag(id)
      toast.success('Etiqueta eliminada correctamente')
      
      // Reset if we were editing the deleted tag
      if (editingTag?.id === id) {
        handleCancelEdit()
      }
      
      await loadTags()
      if (onTagsUpdated) onTagsUpdated()
    } catch (error: any) {
      console.error('Error eliminando etiqueta:', error)
      toast.error('Error al eliminar la etiqueta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: 6 }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Icon icon="tabler:tags" fontSize="1.8rem" style={{ color: '#7367F0' }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Administración de Etiquetas</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <Icon icon="tabler:x" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 6 }}>
        <Grid container spacing={6}>
          {/* Left Side: Create / Edit Form */}
          <Grid item xs={12} md={6} sx={{ borderRight: { md: '1px solid' }, borderColor: 'divider', pr: { md: 6 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 4 }}>
              {editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
            </Typography>
            
            <form onSubmit={handleSave}>
              <TextField
                fullWidth
                label="Nombre"
                placeholder="Ej: Cliente VIP, Prospecto Frío"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                size="small"
                sx={{ mb: 4 }}
              />
              
              {/* Color Preset Picker */}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontWeight: 500 }}>
                Selecciona un color:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={5}>
                {COLOR_PRESETS.map((preset) => (
                  <Tooltip key={preset.hex} title={preset.name}>
                    <Box
                      onClick={() => setSelectedColor(preset.hex)}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: preset.hex,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid',
                        borderColor: selectedColor === preset.hex ? 'text.primary' : 'transparent',
                        boxShadow: 2,
                        transition: 'transform 0.1s ease',
                        '&:hover': {
                          transform: 'scale(1.15)'
                        }
                      }}
                    >
                      {selectedColor === preset.hex && (
                        <Icon icon="tabler:check" fontSize="12px" style={{ color: '#fff' }} />
                      )}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
              
              {/* Live Preview */}
              <Box sx={{ mb: 6, p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Vista Previa del Chip:
                </Typography>
                <Chip
                  label={name.trim() || 'Ejemplo'}
                  size="small"
                  sx={{
                    backgroundColor: `${selectedColor}1e`,
                    color: selectedColor,
                    borderColor: `${selectedColor}3f`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    fontWeight: 600
                  }}
                />
              </Box>

              <Box display="flex" gap={2}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={saving || !name.trim()}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon icon="tabler:device-floppy" />}
                >
                  {editingTag ? 'Actualizar' : 'Crear'}
                </Button>
                {editingTag && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                )}
              </Box>
            </form>
          </Grid>
          
          {/* Right Side: List Tags */}
          <Grid item xs={12} md={6} sx={{ pl: { md: 6 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Etiquetas de la Compañía ({tags.length})
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" py={10}>
                <CircularProgress size={30} />
              </Box>
            ) : tags.length === 0 ? (
              <Box py={8} textAlign="center" sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
                <Icon icon="tabler:tags-off" fontSize="2rem" style={{ opacity: 0.2, marginBottom: 8 }} />
                <Typography variant="body2" color="text.secondary">
                  No hay etiquetas configuradas
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 280, overflowY: 'auto' }}>
                <List dense>
                  {tags.map((tag) => (
                    <React.Fragment key={tag.id}>
                      <ListItem sx={{ py: 2, px: 0 }}>
                        <ListItemText
                          primary={
                            <Chip
                              label={tag.name}
                              size="small"
                              sx={{
                                backgroundColor: `${tag.color || '#7367F0'}1e`,
                                color: tag.color || '#7367F0',
                                borderColor: `${tag.color || '#7367F0'}3f`,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                fontWeight: 500
                              }}
                            />
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Editar">
                            <IconButton 
                              size="small" 
                              color="info" 
                              onClick={() => handleEditClick(tag)}
                              sx={{ mr: 1 }}
                            >
                              <Icon icon="tabler:edit" fontSize="16px" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteClick(tag.id)}
                            >
                              <Icon icon="tabler:trash" fontSize="16px" />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="fullWidth" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 4, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
