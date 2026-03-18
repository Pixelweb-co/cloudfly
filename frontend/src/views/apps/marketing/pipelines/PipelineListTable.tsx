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
  Button
} from '@mui/material'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { pipelineApi } from '@/api/marketing/pipelineApi'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import { useRouter } from 'next/navigation'

interface Props {
  onEdit: (pipeline: Pipeline) => void
  onAdd: () => void
}

export default function PipelineListTable({ onEdit, onAdd }: Props) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadPipelines()
  }, [])

  const loadPipelines = async () => {
    try {
      setLoading(true)
      const data = await pipelineApi.getAllPipelines()
      setPipelines(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro de eliminar este pipeline?')) return
    try {
      await pipelineApi.deletePipeline(id)
      await loadPipelines()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Card>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Embudos de Marketing</Typography>
        <Button variant="contained" onClick={onAdd} startIcon={<Icon icon="tabler-plus" />}>
          Nuevo Embudo
        </Button>
      </Box>
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
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center">Cargando...</TableCell></TableRow>
            ) : pipelines.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No hay embudos registrados</TableCell></TableRow>
            ) : pipelines.map((pipeline) => (
              <TableRow key={pipeline.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: pipeline.color || '#6366F1' }} />
                    <Typography variant="body1" fontWeight="500">{pipeline.name}</Typography>
                    {pipeline.isDefault && <Chip label="Por Defecto" size="small" color="primary" variant="outlined" />}
                  </Box>
                  {pipeline.description && <Typography variant="body2" color="text.secondary">{pipeline.description}</Typography>}
                </TableCell>
                <TableCell>{pipeline.type}</TableCell>
                <TableCell>{pipeline.stages?.length || 0} etapas</TableCell>
                <TableCell>
                  <Chip 
                    label={pipeline.isActive ? 'Activo' : 'Inactivo'} 
                    color={pipeline.isActive ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{format(new Date(pipeline.createdAt), 'dd MMM yyyy')}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => router.push(`/marketing/pipelines/kanban?id=${pipeline.id}`)} color="primary" title="Ver Kanban">
                    <Icon icon="tabler-layout-kanban" />
                  </IconButton>
                  <IconButton onClick={() => onEdit(pipeline)} color="info" title="Editar">
                    <Icon icon="tabler-edit" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(pipeline.id)} color="error" title="Eliminar">
                    <Icon icon="tabler-trash" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}
