'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  IconButton,
  TextField,
  CircularProgress,
  Avatar
} from '@mui/material'
import { Icon } from '@iconify/react'
import { useDropzone } from 'react-dropzone'
import { mediaService, Media } from '@/services/mediaService'
import { toast } from 'react-toastify'

interface MediaLibraryDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (media: Media) => void
  multiple?: boolean
}

const MediaLibraryDialog = ({ open, onClose, onSelect, multiple = false }: MediaLibraryDialogProps) => {
  const [tab, setTab] = useState(0)
  const [mediaList, setMediaList] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  useEffect(() => {
    if (open && tab === 1) {
      fetchMedia()
    }
  }, [open, tab])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const data = await mediaService.getMedia()
      setMediaList(data || [])
    } catch (error) {
      console.error('Error fetching media:', error)
      toast.error('Error al cargar la biblioteca')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const data = searchQuery 
        ? await mediaService.searchMedia(searchQuery)
        : await mediaService.getMedia()
      setMediaList(data || [])
    } catch (error) {
      console.error('Error searching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        try {
          setUploading(true)
          const newMedia = await mediaService.uploadMedia(acceptedFiles[0])
          toast.success('Imagen subida correctamente')
          setTab(1) // Cambiar a la pestaña de biblioteca
          fetchMedia()
          setSelectedMedia(newMedia)
        } catch (error) {
          console.error('Upload error:', error)
          toast.error('Error al subir la imagen')
        } finally {
          setUploading(false)
        }
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  })

  const handleSelect = (media: Media) => {
    setSelectedMedia(media)
  }

  const handleConfirmAction = () => {
    if (selectedMedia) {
      onSelect(selectedMedia)
      onClose()
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta imagen?')) {
      try {
        await mediaService.deleteMedia(id)
        toast.success('Imagen eliminada')
        fetchMedia()
        if (selectedMedia?.id === id) setSelectedMedia(null)
      } catch (error) {
        toast.error('Error al eliminar')
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Biblioteca de Medios</Typography>
        <IconButton onClick={onClose} size="small">
          <Icon icon="tabler:x" />
        </IconButton>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 4 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Subir Archivo" sx={{ py: 3 }} />
          <Tab label="Biblioteca" sx={{ py: 3 }} />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 4, minHeight: 400 }}>
        {tab === 0 ? (
          <Box
            {...getRootProps()}
            sx={{
              height: 350,
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <CircularProgress size={48} />
            ) : (
              <>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.light', mb: 4 }}>
                  <Icon icon="tabler:upload" fontSize={32} />
                </Avatar>
                <Typography variant="h6">Arrastra archivos aquí o haz clic para subir</Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamaño máximo: 5MB. Formatos: JPG, PNG, WEBP
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Box>
            <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar en la biblioteca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="contained" onClick={handleSearch}>Buscar</Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
              </Box>
            ) : mediaList.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography color="text.secondary">No se encontraron archivos</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {mediaList.map((media) => (
                  <Grid item xs={6} sm={4} md={3} key={media.id}>
                    <Card 
                      sx={{ 
                        position: 'relative',
                        border: selectedMedia?.id === media.id ? '2px solid' : '1px solid',
                        borderColor: selectedMedia?.id === media.id ? 'primary.main' : 'divider',
                        boxShadow: selectedMedia?.id === media.id ? 4 : 1
                      }}
                    >
                      <CardActionArea onClick={() => handleSelect(media)}>
                        <CardMedia
                          component="img"
                          height="140"
                          image={`${API_URL}${media.url}`}
                          alt={media.originalName}
                          sx={{ objectFit: 'cover' }}
                        />
                      </CardActionArea>
                      {selectedMedia?.id === media.id && (
                        <Box sx={{ 
                          position: 'absolute', 
                          top: 5, 
                          right: 5, 
                          bgcolor: 'primary.main', 
                          borderRadius: '50%',
                          display: 'flex',
                          p: 0.5
                        }}>
                          <Icon icon="tabler:check" color="white" />
                        </Box>
                      )}
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(media.id);
                        }}
                        sx={{ position: 'absolute', bottom: 5, right: 5, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
                      >
                        <Icon icon="tabler:trash" fontSize={16} />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 4, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button 
          variant="contained" 
          disabled={!selectedMedia} 
          onClick={handleConfirmAction}
          startIcon={<Icon icon="tabler:check" />}
        >
          {multiple ? 'Seleccionar Imágenes' : 'Establecer Imagen'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MediaLibraryDialog
