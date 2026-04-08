'use client'

import React, { useState, useEffect } from 'react'
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
  LinearProgress
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import { useRouter } from 'next/navigation'
import { userMethods } from '@/utils/userMethods'
import PipelineForm from './PipelineForm'

export default function PipelineListTable() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    loadPipelines()
  }, [])

  const loadPipelines = async () => {
    try {
      setLoading(true)
      
      const user = userMethods.getUserLogin()
      const isManager = user?.roles?.some((r: any) => (r.name || r.role || '').includes('MANAGER'))
      const isAdmin = user?.roles?.some((r: any) => (r.name || r.role || '').includes('ADMIN'))
      
      // Filter by tenant and company if is MANAGER or ADMIN
      const tenantId = (isManager || isAdmin) ? (user?.customerId || user?.tenant_id) : undefined
      const companyId = (isManager || isAdmin) ? (user?.activeCompanyId || user?.company_id) : undefined
      
      const data = await pipelineService.getAllPipelines(tenantId, companyId)
      setPipelines(data)
    } catch (e) {
      console.error('Error al cargar pipelines:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline)
    setIsDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedPipeline(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro de eliminar este pipeline?')) return
    try {
      await pipelineService.deletePipeline(id)
      await loadPipelines()
    } catch (e) {
      console.error('Error al eliminar pipeline:', e)
    }
  }

  return (
    <Card>
      <Box sx={{ p: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Embudos de Marketing</Typography>
        <Button 
          variant="contained" 
          onClick={handleAdd} 
          startIcon={<Icon icon="tabler:plus" />}
        >
          Nuevo Embudo
        </Button>
      </Box>
      
      {loading && <LinearProgress />}
      
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Etapas</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Creado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && pipelines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">
                    No hay embudos registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pipelines.map((pipeline) => (
                <TableRow key={pipeline.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: pipeline.color || 'primary.main' }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {pipeline.name}
                        </Typography>
                        {pipeline.isDefault && (
                          <Chip label="Por Defecto" size="small" color="primary" variant="outlined" sx={{ height: 20 }} />
                        )}
                      </Box>
                    </Box>
                    {pipeline.description && (
                      <Typography variant="caption" color="text.disabled">
                        {pipeline.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {pipeline.type.toLowerCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                        label={`${pipeline.stages?.length || 0} etapas`} 
                        size="small" 
                        variant="tonal" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={pipeline.isActive ? 'Activo' : 'Inactivo'} 
                      color={pipeline.isActive ? 'success' : 'secondary'} 
                      size="small" 
                      variant="tonal"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                        {format(new Date(pipeline.createdAt), 'dd/MM/yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                        onClick={() => router.push(`/marketing/pipelines/kanban?id=${pipeline.id}`)} 
                        color="primary" 
                        title="Ver Kanban"
                    >
                      <Icon icon="tabler:layout-kanban" />
                    </IconButton>
                    <IconButton onClick={() => handleEdit(pipeline)} color="info" title="Editar">
                      <Icon icon="tabler:edit" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(pipeline.id)} color="error" title="Eliminar">
                      <Icon icon="tabler:trash" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PipelineForm 
        open={isDialogOpen} 
        handleClose={() => setIsDialogOpen(false)} 
        selectedPipeline={selectedPipeline}
        onSuccess={loadPipelines}
      />
    </Card>
  )
}
