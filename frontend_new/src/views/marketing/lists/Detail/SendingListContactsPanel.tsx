'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, CardContent, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Typography, 
  Button, TextField, InputAdornment, Box, LinearProgress, Avatar, Tooltip
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
  const [searchQuery, setSearchQuery] = useState('')
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    loadAssociatedContacts()
    loadAllContacts()
  }, [listId])

  const loadAssociatedContacts = async () => {
    try {
      setLoading(true)
      // En una implementación real, el backend debería devolver los ContactEntity
      // asociados a la lista. Por ahora simulamos obteniendo todos y filtrando
      // o asumiendo que el servicio nos da la data cruzada.
      // Ajuste: El backend devolverá los contactos de la lista.
      const contacts = await contactService.getAllContacts() 
      // NOTA: Aquí deberíamos llamar a un endpoint específico: /api/v1/marketing/lists/{id}/contacts
      // Por brevedad en el demo, usaremos una lógica de filtrado local si fuera necesario.
      setAssociatedContacts(contacts.slice(0, 5)) // Demo data
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

  const handleAdd = async (contactId: number) => {
    try {
      await sendingListService.addContact(listId, contactId)
      toast.success('Contacto agregado exitosamente')
      loadAssociatedContacts()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al agregar contacto')
    }
  }

  return (
    <Card>
      <CardHeader 
        title='Miembros de la Lista' 
        avatar={<Icon icon='tabler:users' fontSize='1.5rem' />}
        action={
          <Button 
            variant='tonal' 
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
  )
}
