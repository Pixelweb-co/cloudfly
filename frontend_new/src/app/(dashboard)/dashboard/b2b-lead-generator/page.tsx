'use client'

import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Divider
} from '@mui/material'
import { Icon } from '@iconify/react'
import CustomChip from '@/@core/components/mui/Chip'
import { axiosInstance } from '@/utils/axiosInstance'

// --- TYPES ---

type LeadScore = "HOT" | "WARM" | "COLD"

type LeadPreview = {
  name: string
  company?: string
  phone?: string
  city?: string
  score: LeadScore
}

type SearchFilters = {
  keyword: string
  country: string
  state: string
  city: string
  limit: number
  source: 'auto' | 'google_maps' | 'instagram'
  enrich: boolean
}

// --- CONSTANTS ---

const SCORE_COLORS: Record<LeadScore, "success" | "warning" | "error"> = {
  HOT: "success",
  WARM: "warning",
  COLD: "error"
}

// --- COMPONENT ---

export default function B2BLeadGeneratorPage() {
  // State
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    country: 'Colombia',
    state: '',
    city: '',
    limit: 20,
    source: 'auto',
    enrich: true
  })

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [leadsPreview, setLeadsPreview] = useState<LeadPreview[]>([])
  const [selectedLeads, setSelectedLeads] = useState<LeadPreview[]>([])
  
  // Feedback
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Handlers
  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filters.keyword) {
      showSnackbar('Por favor ingrese una palabra clave', 'error')
      return
    }

    try {
      setLoading(true)
      setLeadsPreview([])
      setSelectedLeads([])

      const response = await axiosInstance.post('/api/leads/generate', {
        mode: 'manual',
        filters: filters
      })

      // Suponiendo que el backend devuelve un array de leads
      const data = response.data.leads || response.data || []
      setLeadsPreview(data)
      
      if (data.length === 0) {
        showSnackbar('No se encontraron leads para esta búsqueda', 'error')
      } else {
        showSnackbar(`${data.length} leads encontrados`, 'success')
      }
    } catch (error) {
      console.error('Error searching leads:', error)
      showSnackbar('Error al buscar leads. Intente nuevamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads([...leadsPreview])
    } else {
      setSelectedLeads([])
    }
  }

  const handleToggleSelectOne = (lead: LeadPreview, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, lead])
    } else {
      setSelectedLeads(prev => prev.filter(l => l !== lead))
    }
  }

  const handleSaveToCRM = async () => {
    if (selectedLeads.length === 0) return

    try {
      setSaving(true)
      await axiosInstance.post('/api/contacts/bulk', {
        leads: selectedLeads
      })

      showSnackbar(`¡${selectedLeads.length} leads guardados exitosamente en el CRM!`, 'success')
      setSelectedLeads([])
      // Opcional: remover de la vista los ya guardados
      setLeadsPreview(prev => prev.filter(l => !selectedLeads.includes(l)))
    } catch (error) {
      console.error('Error saving leads:', error)
      showSnackbar('Error al guardar leads en el CRM.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const isAllSelected = leadsPreview.length > 0 && selectedLeads.length === leadsPreview.length

  return (
    <Box className='p-6'>
      <Typography variant='h4' className='mb-6 font-bold'>
        Generador de Leads B2B
      </Typography>

      {/* FORMULARIO DE BÚSQUEDA */}
      <Card className='shadow-md mb-8'>
        <CardContent>
          <Typography variant='h6' className='mb-4 flex items-center gap-2'>
            <Icon icon='tabler:search' />
            Búsqueda de Prospectos
          </Typography>
          <form onSubmit={handleSearch}>
            <Stack spacing={4}>
              <Box className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <TextField
                  fullWidth
                  label='Palabra Clave (e.g. Restaurantes)'
                  value={filters.keyword}
                  onChange={e => handleFilterChange('keyword', e.target.value)}
                  placeholder='¿Qué buscas?'
                  required
                />
                <TextField
                  fullWidth
                  label='País'
                  value={filters.country}
                  onChange={e => handleFilterChange('country', e.target.value)}
                  placeholder='Colombia'
                />
                <TextField
                  fullWidth
                  label='Departamento/Estado'
                  value={filters.state}
                  onChange={e => handleFilterChange('state', e.target.value)}
                  placeholder='Antioquia'
                />
                <TextField
                  fullWidth
                  label='Ciudad'
                  value={filters.city}
                  onChange={e => handleFilterChange('city', e.target.value)}
                  placeholder='Medellín'
                />
                <TextField
                  fullWidth
                  type='number'
                  label='Límite'
                  value={filters.limit}
                  onChange={e => handleFilterChange('limit', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 100 }}
                />
                <FormControl fullWidth>
                  <InputLabel>Fuente</InputLabel>
                  <Select
                    value={filters.source}
                    label='Fuente'
                    onChange={e => handleFilterChange('source', e.target.value)}
                  >
                    <MenuItem value='auto'>Automático</MenuItem>
                    <MenuItem value='google_maps'>Google Maps</MenuItem>
                    <MenuItem value='instagram'>Instagram</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box className='flex items-center justify-between'>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.enrich}
                      onChange={e => handleFilterChange('enrich', e.target.checked)}
                    />
                  }
                  label='Enriquecer datos (Email, Web, Social)'
                />
                <Button
                  type='submit'
                  variant='contained'
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <Icon icon='tabler:search' />}
                >
                  {loading ? 'Buscando...' : 'Buscar Leads'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* RESULTADOS (PREVIEW) */}
      {leadsPreview.length > 0 && (
        <Card className='shadow-lg'>
          <CardContent>
            <Box className='flex flex-wrap items-center justify-between mb-4 gap-4'>
              <Typography variant='h6'>
                {leadsPreview.length} leads encontrados | {selectedLeads.length} seleccionados
              </Typography>
              <Button
                variant='contained'
                color='primary'
                size='large'
                onClick={handleSaveToCRM}
                disabled={selectedLeads.length === 0 || saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Icon icon='tabler:database-export' />}
              >
                {saving ? 'Guardando...' : 'Guardar en CRM'}
              </Button>
            </Box>

            <TableContainer component={Paper} className='border border-gray-200'>
              <Table className='min-w-[800px]'>
                <TableHead>
                  <TableRow className='bg-gray-50'>
                    <TableCell padding='checkbox'>
                      <Checkbox
                        indeterminate={selectedLeads.length > 0 && selectedLeads.length < leadsPreview.length}
                        checked={isAllSelected}
                        onChange={e => handleToggleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className='font-bold'>Nombre</TableCell>
                    <TableCell className='font-bold'>Empresa</TableCell>
                    <TableCell className='font-bold'>Teléfono</TableCell>
                    <TableCell className='font-bold'>Ciudad</TableCell>
                    <TableCell className='font-bold'>Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadsPreview.map((lead, index) => {
                    const isSelected = selectedLeads.includes(lead)
                    return (
                      <TableRow key={index} hover selected={isSelected}>
                        <TableCell padding='checkbox'>
                          <Checkbox
                            checked={isSelected}
                            onChange={e => handleToggleSelectOne(lead, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant='body2' className='font-medium'>
                            {lead.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{lead.company || '-'}</TableCell>
                        <TableCell>{lead.phone || '-'}</TableCell>
                        <TableCell>{lead.city || '-'}</TableCell>
                        <TableCell>
                          <CustomChip
                            label={lead.score}
                            size='small'
                            color={SCORE_COLORS[lead.score]}
                            variant='tonal'
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* NO RESULTS PLACEHOLDER */}
      {!loading && leadsPreview.length === 0 && (
        <Box className='flex flex-col items-center justify-center py-20 opacity-60'>
          <Icon icon='tabler:database-search' fontSize={64} className='mb-4' />
          <Typography variant='h6'>Realice una búsqueda para ver resultados</Typography>
        </Box>
      )}

      {/* SNACKBAR FEEDBACK */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
