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
  Avatar,
  Tooltip,
  Paper
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { contactService } from '@/services/marketing/contactService'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Contact } from '@/types/marketing/contactTypes'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import { userMethods } from '@/utils/userMethods'

export default function ContactListTable() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const user = userMethods.getUserLogin()
      const isManager = user?.roles?.some((r: any) => (r.name || r.role || '').includes('MANAGER'))
      const isAdmin = user?.roles?.some((r: any) => (r.name || r.role || '').includes('ADMIN'))
      
      const tenantId = (isManager || isAdmin) ? (user?.customerId || user?.tenant_id) : undefined
      const companyId = (isManager || isAdmin) ? (user?.activeCompanyId || user?.company_id) : undefined
      
      // Load both contacts and pipelines in parallel for better UX
      const [contactsData, pipelinesData] = await Promise.all([
        contactService.getAllContacts(tenantId, companyId),
        pipelineService.getAllPipelines(tenantId, companyId)
      ])
      
      setContacts(contactsData)
      setPipelines(pipelinesData)
    } catch (e) {
      console.error('Error al cargar datos:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (contact: Contact) => {
    router.push(`/marketing/contacts/${contact.id}`)
  }

  const handleAdd = () => {
    router.push(`/marketing/contacts/new`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro de eliminar este contacto?')) return
    try {
      const user = userMethods.getUserLogin()
      const companyId = user?.activeCompanyId || user?.company_id
      await contactService.deleteContact(id, companyId)
      await loadData()
    } catch (e) {
      console.error('Error al eliminar contacto:', e)
    }
  }

  const getPipelineName = (id?: number) => {
    if (!id) return 'N/A'
    const p = pipelines.find(item => item.id === id)
    return p ? p.name : 'Desconocido'
  }

  const getStageName = (pipelineId?: number, stageId?: number) => {
    if (!pipelineId || !stageId) return 'Buzón de Entrada'
    const p = pipelines.find(item => item.id === pipelineId)
    if (!p || !p.stages) return 'Desconocido'
    const s = p.stages.find(item => item.id === stageId)
    return s ? s.name : 'Desconocido'
  }

  return (
    <Card>
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Gestión de Contactos</Typography>
        <Button 
          variant="contained" 
          onClick={handleAdd} 
          startIcon={<Icon icon="tabler:plus" />}
        >
          Nuevo Contacto
        </Button>
      </Box>
      
      {loading && <LinearProgress />}
      
      <TableContainer>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>Contacto</TableCell>
              <TableCell>Identificación</TableCell>
              <TableCell>Embudo / Etapa</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Última Actividad</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay contactos registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar 
                        src={contact.avatarUrl} 
                        sx={{ width: 32, height: 32, bgcolor: contact.isActive ? 'primary.main' : 'divider' }}
                      >
                        {contact.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {contact.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {contact.email || contact.phone || 'Sin datos de contacto'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {contact.documentType || 'NIT'}: {contact.documentNumber || contact.taxId || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                        {getPipelineName(contact.pipelineId)}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {getStageName(contact.pipelineId, contact.stageId)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={contact.type || 'LEAD'} 
                      size="small" 
                      variant="tonal" 
                      color={contact.type === 'CLIENT' ? 'info' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={contact.isActive ? 'Activo' : 'Inactivo'} 
                      color={contact.isActive ? 'success' : 'secondary'} 
                      size="small" 
                      variant="tonal"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                        {format(new Date(contact.updatedAt || contact.createdAt), 'dd/MM/yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleEdit(contact)} color="info">
                        <Icon icon="tabler:edit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(contact.id)} color="error">
                        <Icon icon="tabler:trash" />
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
