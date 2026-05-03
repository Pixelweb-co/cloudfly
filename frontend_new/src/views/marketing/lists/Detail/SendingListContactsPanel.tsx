'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Typography, 
  Button, TextField, InputAdornment, Box, LinearProgress, Avatar, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete
} from '@mui/material'
import { Icon } from '@iconify/react'
import { sendingListService } from '@/services/marketing/sendingListService'
import { contactService } from '@/services/marketing/contactService'
import { Contact } from '@/types/marketing/contactTypes'
import { SendingListContact } from '@/types/marketing/sendingListTypes'
import toast from 'react-hot-toast'

interface Props {
  listId: number
}

export default function SendingListContactsPanel({ listId }: Props) {
  const [associatedContacts, setAssociatedContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadAssociatedContacts()
    loadAllContacts()
  }, [listId])

  const loadAssociatedContacts = async () => {
    try {
      setLoading(true)
      // En una implementación real, esto consultaría un endpoint de relación
      const contacts = await contactService.getAllContacts() 
      setAssociatedContacts(contacts.slice(0, 5)) // Mocking current members
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadAllContacts = async () => {
    try {
      const contacts = await contactService.getAllContacts()
      setAllContacts(contacts)
    } catch (e) {
      console.error(e)
    }
  }

  const handleRemove = async (contactId: number) => {
    try {
      await sendingListService.removeContact(listId, contactId)
      toast.success('Contacto removido de la lista')
      loadAssociatedContacts()
    } catch (e) {
      toast.error('Error al remover contacto')
    }
  }

  const handleConfirmAdd = async () => {
    if (!selectedContact) return
    try {
      setAdding(true)
      await sendingListService.addContact(listId, selectedContact.id)
      toast.success('Contacto agregado exitosamente')
      setSelectedContact(null)
      setShowAddModal(false)
      loadAssociatedContacts()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al agregar contacto')
    } finally {
      setAdding(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader 
          title='Miembros de la Lista' 
          avatar={<Icon icon='tabler:users' fontSize='1.5rem' />}
          action={
            <Button 
              variant='contained' 
              startIcon={<Icon icon='tabler:user-plus' />}
              onClick={() => setShowAddModal(true)}
            >
              Agregar Miembros
            </Button>
          }
        />
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress sx={{ height: 2 }} />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Email / Teléfono</TableCell>
                  <TableCell align='right'>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {associatedContacts.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={3} align='center' sx={{ py: 6 }}>
                      <Typography color='text.secondary'>No hay contactos en esta lista</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  associatedContacts.map((contact) => (
                    <TableRow key={contact.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Avatar src={contact.avatarUrl} sx={{ width: 32, height: 32 }}>
                            {contact.name.charAt(0)}
                          </Avatar>
                          <Typography variant='body2' sx={{ fontWeight: 500 }}>{contact.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='caption' display='block'>{contact.email}</Typography>
                        <Typography variant='caption' display='block'>{contact.phone}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Tooltip title='Quitar de la lista'>
                          <IconButton color='error' size='small' onClick={() => handleRemove(contact.id)}>
                            <Icon icon='tabler:user-minus' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Diálogo para Agregar Miembros */}
      <Dialog 
        open={showAddModal} 
        onClose={() => setShowAddModal(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Agregar Miembro a la Lista</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant='body2' sx={{ mb: 4 }}>
            Busca un contacto por nombre, identificación, email o teléfono para añadirlo a esta lista de envío.
          </Typography>
          <Autocomplete
            fullWidth
            options={allContacts}
            getOptionLabel={(option) => `${option.name} (${option.identification || 'N/A'}) - ${option.phone || option.email}`}
            value={selectedContact}
            onChange={(_, newValue) => setSelectedContact(newValue)}
            renderInput={(params) => (
              <TextField 
                {...params} 
                label='Buscar contacto...' 
                placeholder='Escribe nombre, cédula, email...'
                variant='outlined'
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar src={option.avatarUrl} sx={{ width: 24, height: 24 }}>
                    {option.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 500 }}>{option.name}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      ID: {option.identification || 'Sin ID'} | {option.phone || option.email}
                    </Typography>
                  </Box>
                </Box>
              </li>
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddModal(false)} color='secondary'>Cancelar</Button>
          <Button 
            onClick={handleConfirmAdd} 
            variant='contained' 
            disabled={!selectedContact || adding}
            startIcon={adding ? <LinearProgress size={16} /> : <Icon icon='tabler:plus' />}
          >
            Agregar a la Lista
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

