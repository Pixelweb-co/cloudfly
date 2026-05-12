'use client'

import React, { useState, useEffect } from 'react'
import { Box, Card, CardContent, Typography, MenuItem, Select, FormControl, InputLabel, CircularProgress, Alert, Grid } from '@mui/material'
import PipelineKanbanBoard from '@/views/marketing/pipelines/Kanban/PipelineKanbanBoard'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import { useSearchParams, useRouter } from 'next/navigation'

export default function PipelinesKanbanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlId = searchParams.get('id')
  
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedId, setSelectedId] = useState<number | ''>(urlId ? parseInt(urlId) : '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPipelines()
  }, [])

  const loadPipelines = async () => {
    try {
      setLoading(true)
      
      // Obtener tenant y company actuales desde localStorage (mismo patrón que axiosInstance)
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('activeTenantId') : null
      const companyId = typeof window !== 'undefined' ? localStorage.getItem('activeCompanyId') : null
      
      const data = await pipelineService.getAllPipelines(
        tenantId ? parseInt(tenantId) : undefined, 
        companyId ? parseInt(companyId) : undefined
      )
      
      const pipelineList = Array.isArray(data) ? data : []
      setPipelines(pipelineList)
      
      if (pipelineList.length > 0 && !selectedId) {
        // If no ID in URL, select the first one or default
        const defaultPipeline = pipelineList.find(p => p.isDefault) || pipelineList[0]
        setSelectedId(defaultPipeline.id)
        router.push(`/marketing/pipelines/kanban?id=${defaultPipeline.id}`)
      }
    } catch (err: any) {
      setError('Error al cargar la lista de embudos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePipelineChange = (id: number) => {
    setSelectedId(id)
    router.push(`/marketing/pipelines/kanban?id=${id}`)
  }

  if (loading && pipelines.length === 0) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
              <Box>
                <Typography variant="h5" sx={{ mb: 0.5 }}>Tablero Kanban</Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestiona tus prospectos a través de las etapas del embudo de ventas.
                </Typography>
              </Box>
              
              <FormControl sx={{ minWidth: 250 }}>
                <InputLabel id="pipeline-select-label">Seleccionar Embudo</InputLabel>
                <Select
                  labelId="pipeline-select-label"
                  id="pipeline-select"
                  value={selectedId}
                  label="Seleccionar Embudo"
                  onChange={(e) => handlePipelineChange(e.target.value as number)}
                  size="small"
                >
                  {pipelines.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.isDefault ? '(Principal)' : ''}
                    </MenuItem>
                  ))}
                  {pipelines.length === 0 && (
                    <MenuItem disabled value="">No hay embudos disponibles</MenuItem>
                  )}
                </Select>
              </FormControl>
            </CardContent>

            <Box sx={{ p: 4, pt: 0 }}>
              {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

              {selectedId ? (
                <PipelineKanbanBoard pipelineId={selectedId} />
              ) : (
                !loading && (
                  <Alert severity="info">
                    Por favor selecciona un embudo para visualizar el tablero Kanban.
                  </Alert>
                )
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
