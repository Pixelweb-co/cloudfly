'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  Tooltip,
  Paper
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { sendingListService } from '@/services/marketing/sendingListService'
import { SendingList } from '@/types/marketing/sendingListTypes'

export default function SendingListTable() {
  const [lists, setLists] = useState<SendingList[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await sendingListService.getAll()
      setLists(data)
    } catch (e) {
      console.error('Error al cargar listas:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (list: SendingList) => {
    router.push(`/marketing/lists/${list.id}`)
  }

  const handleAdd = () => {
    router.push(`/marketing/lists/new`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro de archivar esta lista?')) return
    try {
      await sendingListService.delete(id)
      await loadData()
    } catch (e) {
      console.error('Error al archivar lista:', e)
    }
  }

  const getStatusChip = (status: string) => {
    const colors: any = {
      ACTIVE: 'success',
      INACTIVE: 'warning',
      ARCHIVED: 'error'
    }
    return <Chip label={status} size='small' color={colors[status] || 'default'} variant='tonal' />
  }

  return (
    <Card>
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5'>Listas de Envío</Typography>
        <Button 
          variant='contained' 
          startIcon={<Icon icon='tabler:plus' />}
          onClick={handleAdd}
        >
          Nueva Lista
        </Button>
      </Box>
      
      {loading && <LinearProgress sx={{ height: 2 }} />}
      
      <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Contactos</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creada el</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lists.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} align='center' sx={{ py: 10 }}>
                  <Typography color='text.secondary'>No se encontraron listas</Typography>
                </TableCell>
              </TableRow>
            ) : (
              lists.map((list) => (
                <TableRow key={list.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant='body1' sx={{ fontWeight: 500 }}>{list.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>{list.description}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${list.totalContacts} contactos`} 
                      size='small' 
                      icon={<Icon icon='tabler:users' />}
                      variant='outlined'
                    />
                  </TableCell>
                  <TableCell>{getStatusChip(list.status)}</TableCell>
                  <TableCell>
                    <Typography variant='body2'>
                      {list.createdAt ? format(new Date(list.createdAt), 'dd/MM/yyyy') : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Ver detalle'>
                      <IconButton onClick={() => handleEdit(list)}>
                        <Icon icon='tabler:eye' />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Archivar'>
                      <IconButton color='error' onClick={() => handleDelete(list.id)}>
                        <Icon icon='tabler:trash' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}
