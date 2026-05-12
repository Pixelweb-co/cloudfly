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
  IconButton,
  Autocomplete
} from '@mui/material'
import { pipelineService } from '@/services/marketing/pipelineService'
import { getInitials } from '@/utils/getInitials'
import QuickContactForm from './QuickContactForm'
import { Icon } from '@iconify/react'
import { customerService } from '@/services/customers/customerService'
import type { Customer } from '@/types/customers'

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
  nit?: string
}

export default function AddProspectDialog({ open, onClose, pipelineId, targetStageId, onSuccess }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ContactSearchResult[]>([])
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  // Fetch customers on mount
  React.useEffect(() => {
    if (open && results.length === 0) {
      loadCustomers()
    }
  }, [open])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const customers = await customerService.getActiveCustomers()
      const mapped = customers.map(c => ({
        id: c.id,
        name: c.name || 'Sin nombre',
        email: c.email || '',
        phone: c.phone || '',
        nit: c.nit || undefined
      }))
      setResults(mapped)
    } catch (e) {
      console.error('Error fetching customers:', e)
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
          <Box sx={{ mb: 5 }}>
            <Autocomplete
              fullWidth
              options={results}
              getOptionLabel={(option) => `${option.name} ${option.nit ? `(${option.nit})` : ''}`}
              filterOptions={(options, state) => {
                const inputValue = state.inputValue.toLowerCase();
                return options.filter(o => 
                  o.name.toLowerCase().includes(inputValue) || 
                  (o.nit && o.nit.toLowerCase().includes(inputValue))
                );
              }}
              onChange={(event, newValue) => {
                if (newValue) {
                  handleSelectContact(newValue.id);
                }
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 2 }}>
                      {getInitials(option.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={option.name} 
                    secondary={
                      <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                          ID: {option.nit || 'N/A'}
                        </Typography>
                        {option.email && ` | ${option.email}`}
                      </React.Fragment>
                    } 
                  />
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar por nombre o documento..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              noOptionsText={
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No se encontraron contactos.
                  </Typography>
                  <Button variant="text" onClick={() => setShowQuickCreate(true)} color="primary" size="small">
                    Crear nuevo
                  </Button>
                </Box>
              }
            />
          </Box>

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
