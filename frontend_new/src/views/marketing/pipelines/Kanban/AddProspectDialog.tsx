'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton
} from '@mui/material'
import { pipelineService } from '@/services/marketing/pipelineService'
import { getInitials } from '@/@core/utils/get-initials'
import QuickContactForm from './QuickContactForm'
import { Icon } from '@iconify/react'

interface Props {
  open: boolean
  onClose: () => void
  pipelineId: number
  targetStageId: number
  onSuccess: () => void
}

interface ContactSearchResult {
  id: number
  name: string
  email: string
  phone: string
}

export default function AddProspectDialog({ open, onClose, pipelineId, targetStageId, onSuccess }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ContactSearchResult[]>([])
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm) return
    setLoading(true)
    try {
      // Mock search or replace with actual contactApi.search(searchTerm)
      console.log('Searching contacts mock:', searchTerm)
      setResults([]) 
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContact = async (contactId: number) => {
    try {
      setLoading(true)
      await pipelineService.assignConversationToPipeline(
        `new-conv-${contactId}-${Date.now()}`, 
        pipelineId, 
        targetStageId
      )
      onSuccess()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Añadir Prospecto a la Etapa</Typography>
        <IconButton size="small" onClick={onClose}>
          <Icon icon="tabler:x" />
        </IconButton>
      </DialogTitle>
      
      {!showQuickCreate ? (
        <DialogContent dividers sx={{ p: 5 }}>
          <Box sx={{ display: 'flex', gap: 3, mb: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading}>
              Buscar
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {results.map((contact) => (
                <ListItem 
                  key={contact.id} 
                  sx={{ cursor: 'pointer', mb: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleSelectContact(contact.id)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                        {getInitials(contact.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={contact.name} 
                    secondary={`${contact.email} | ${contact.phone}`} 
                    primaryTypographyProps={{ variant: 'body1', fontWeight: 500 }}
                  />
                </ListItem>
              ))}
              
              {results.length === 0 && searchTerm && !loading && (
                <Box sx={{ textAlign: 'center', mt: 5 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No se encontraron contactos.
                  </Typography>
                  <Button variant="text" onClick={() => setShowQuickCreate(true)} color="primary">
                    Crear nuevo contacto
                  </Button>
                </Box>
              )}
              
              {!searchTerm && !loading && (
                <Box sx={{ textAlign: 'center', mt: 5 }}>
                    <Typography variant="body2" color="text.disabled">
                        Ingresa un término para buscar prospectos existentes
                    </Typography>
                </Box>
              )}
            </List>
          )}

        </DialogContent>
      ) : (
        <DialogContent dividers sx={{ p: 5 }}>
          <QuickContactForm 
            onCancel={() => setShowQuickCreate(false)}
            onCreated={(newContactId) => handleSelectContact(newContactId)}
          />
        </DialogContent>
      )}

      <DialogActions sx={{ p: 5 }}>
        <Button onClick={onClose} color="secondary">Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
