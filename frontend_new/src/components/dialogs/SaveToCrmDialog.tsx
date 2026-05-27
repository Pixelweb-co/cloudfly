'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Box,
  Divider,
  IconButton
} from '@mui/material'
import { Icon } from '@iconify/react'
import { axiosInstance } from '@/utils/axiosInstance'

type List = {
  id: number
  name: string
}

interface SaveToCrmDialogProps {
  open: boolean
  onClose: () => void
  onSave: (listId: number) => void
  loading?: boolean
}

export default function SaveToCrmDialog({ open, onClose, onSave, loading: savingLeads }: SaveToCrmDialogProps) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedListId, setSelectedListId] = useState<number | ''>('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creatingList, setCreatingList] = useState(false)

  useEffect(() => {
    if (open) {
      fetchLists()
      // Reset state
      setIsCreatingNew(false)
      setNewListName('')
      setSelectedListId('')
    }
  }, [open])

  const fetchLists = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/api/v1/marketing/lists')
      setLists(response.data || [])
    } catch (error) {
      console.error('Error fetching lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (isCreatingNew) {
      if (!newListName) return
      try {
        setCreatingList(true)
        const response = await axiosInstance.post('/api/v1/marketing/lists', {
          name: newListName,
          status: 'ACTIVE'
        })
        const newList = response.data
        onSave(newList.id)
      } catch (error) {
        console.error('Error creating list:', error)
      } finally {
        setCreatingList(false)
      }
    } else {
      if (selectedListId) {
        onSave(selectedListId as number)
      }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle className='flex items-center justify-between'>
        <Typography variant='h5' component='span' className='font-bold'>
          Guardar en CRM
        </Typography>
        <IconButton onClick={onClose} size='small'>
          <Icon icon='tabler:x' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant='body1' className='mb-4'>
          Selecciona una lista de envío para asociar estos contactos.
        </Typography>

        {!isCreatingNew ? (
          <Box className='flex flex-col gap-4'>
            <FormControl fullWidth>
              <InputLabel>Lista de Envío</InputLabel>
              <Select
                value={selectedListId}
                label='Lista de Envío'
                onChange={e => setSelectedListId(e.target.value as number)}
                disabled={loading}
              >
                {loading ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} className='mr-2' /> Cargando...
                  </MenuItem>
                ) : (
                  lists.map(list => (
                    <MenuItem key={list.id} value={list.id}>
                      {list.name}
                    </MenuItem>
                  ))
                )}
                {lists.length === 0 && !loading && (
                  <MenuItem disabled>No hay listas disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
            <Button
              variant='text'
              startIcon={<Icon icon='tabler:plus' />}
              onClick={() => setIsCreatingNew(true)}
              className='self-start'
            >
              Crear nueva lista
            </Button>
          </Box>
        ) : (
          <Box className='flex flex-col gap-4'>
            <TextField
              fullWidth
              label='Nombre de la Nueva Lista'
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder='Ej: Campaña Mayo 2024'
              autoFocus
            />
            <Button
              variant='text'
              startIcon={<Icon icon='tabler:list' />}
              onClick={() => setIsCreatingNew(false)}
              className='self-start'
            >
              Seleccionar lista existente
            </Button>
          </Box>
        )}
      </DialogContent>
      <Divider />
      <DialogActions className='p-4'>
        <Button onClick={onClose} color='secondary'>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant='contained'
          disabled={(!isCreatingNew && !selectedListId) || (isCreatingNew && !newListName) || creatingList || savingLeads}
          startIcon={(creatingList || savingLeads) ? <CircularProgress size={20} /> : <Icon icon='tabler:database-export' />}
        >
          {creatingList ? 'Creando Lista...' : savingLeads ? 'Guardando Leads...' : 'Confirmar y Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
