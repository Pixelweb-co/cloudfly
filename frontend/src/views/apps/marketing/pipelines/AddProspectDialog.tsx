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
  ListItemText
} from '@mui/material'
import { pipelineApi } from '@/api/marketing/pipelineApi'
import { getInitials } from '@/@core/utils/get-initials'
import QuickContactForm from './QuickContactForm'

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
      setResults([]) // Set your API results here
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectContact = async (contactId: number) => {
    try {
      setLoading(true)
      // Call backend to assign contact. Since backend requires conversation ID, 
      // we generate a default one or let backend create it.
      await pipelineApi.assignConversationToPipeline(
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
      <DialogTitle>Añadir Prospecto a la Etapa</DialogTitle>
      
      {!showQuickCreate ? (
        <DialogContent dividers>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {results.map((contact) => (
                <ListItem 
                  key={contact.id} 
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => handleSelectContact(contact.id)}
                >
                  <ListItemAvatar>
                    <Avatar>{getInitials(contact.name)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={contact.name} secondary={`${contact.email} | ${contact.phone}`} />
                </ListItem>
              ))}
              
              {results.length === 0 && searchTerm && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No se encontraron contactos.
                  </Typography>
                  <Button variant="text" onClick={() => setShowQuickCreate(true)}>
                    Crear nuevo contacto
                  </Button>
                </Box>
              )}
            </List>
          )}

        </DialogContent>
      ) : (
        <DialogContent dividers>
          <QuickContactForm 
            onCancel={() => setShowQuickCreate(false)}
            onCreated={(newContactId) => handleSelectContact(newContactId)}
          />
        </DialogContent>
      )}

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  )
}
