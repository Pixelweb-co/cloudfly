'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  Paper,
  TablePagination
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { contactService } from '@/services/marketing/contactService'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Contact } from '@/types/marketing/contactTypes'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import { userMethods } from '@/utils/userMethods'

import CRMStatsCards from './CRMStatsCards'
import TableFilters from './TableFilters'

export default function ContactListTable() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Pagination states - "de 10 en 10 inicialmente"
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
      
      // Load contacts and pipelines in parallel
      const [contactsData, pipelinesData] = await Promise.all([
        contactService.getAllContacts(),
        pipelineService.getAllPipelines(tenantId, companyId)
      ])
      
      // Sort contacts by id descending initially (newest first)
      const sortedContacts = (contactsData || []).sort((a: any, b: any) => b.id - a.id)
      
      setContacts(sortedContacts)
      setFilteredContacts(sortedContacts)
      setPipelines(pipelinesData || [])
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
      await contactService.deleteContact(id)
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

  const handleSetFilteredContacts = (newFiltered: Contact[]) => {
    setFilteredContacts(newFiltered)
    setPage(0) // Reset to first page on filter change
  }

  // Paginated and sliced contacts for performance
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [filteredContacts, page, rowsPerPage])

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      LEAD: 'Lead',
      POTENTIAL_CUSTOMER: 'Cliente Potencial',
      CUSTOMER: 'Cliente',
      CLIENT: 'Cliente',
      SUPPLIER: 'Proveedor',
      OTHER: 'Otro'
    }
    return types[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      LEAD: 'warning',
      POTENTIAL_CUSTOMER: 'primary',
      CUSTOMER: 'success',
      CLIENT: 'success',
      SUPPLIER: 'info',
      OTHER: 'secondary'
    }
    return colors[type] || 'secondary'
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* 4 Premium CRM Stats Cards with dynamic live data */}
      <CRMStatsCards contactsData={contacts} />

      <Card>
        <Box sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h5">Gestión de Contactos</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Total: {filteredContacts.length} contactos filtrados (de {contacts.length} en total)
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            onClick={handleAdd} 
            startIcon={<Icon icon="tabler:plus" />}
          >
            Nuevo Contacto
          </Button>
        </Box>
        
        {/* Dynamic, live searching and filtering bar */}
        <TableFilters 
          setData={handleSetFilteredContacts} 
          tableData={contacts} 
          pipelines={pipelines} 
        />

        {loading && <LinearProgress />}
        
        <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
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
              {!loading && filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                    <Typography variant="body1" color="text.secondary">
                      No hay contactos que coincidan con la búsqueda
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedContacts.map((contact) => (
                  <TableRow 
                    key={contact.id} 
                    hover 
                    onClick={() => handleEdit(contact)} 
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar 
                          src={contact.avatarUrl} 
                          sx={{ width: 32, height: 32, bgcolor: contact.isActive ? 'primary.main' : 'divider' }}
                        >
                          {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
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
                        label={getTypeLabel(contact.type)} 
                        size="small" 
                        variant="tonal" 
                        color={getTypeColor(contact.type)}
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
                        {contact.updatedAt || contact.createdAt 
                          ? format(new Date(contact.updatedAt || contact.createdAt), 'dd/MM/yyyy') 
                          : 'N/A'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton 
                          onClick={() => handleEdit(contact)} 
                          color="info"
                        >
                          <Icon icon="tabler:edit" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton 
                          onClick={() => handleDelete(contact.id)} 
                          color="error"
                        >
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

        {/* Premium MUI Pagination component matching exactly "de 10 en 10 inicialmente" */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredContacts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="Contactos por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Card>
    </Box>
  )
}
