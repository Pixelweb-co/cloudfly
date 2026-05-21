'use client'

import { useState, useEffect } from 'react'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'

import CustomTextField from '@core/components/mui/TextField'
import type { ContactType } from '@/types/apps/contactType'
import { pipelineApi } from '@/api/marketing/pipelineApi'
import type { Pipeline, PipelineStage } from '@/types/marketing/pipelineTypes'

const TableFilters = ({ setData, tableData }: { setData: any; tableData: ContactType[] }) => {
    const [nameSearch, setNameSearch] = useState('')
    const [docSearch, setDocSearch] = useState('')
    const [status, setStatus] = useState<string>('')
    const [pipelineId, setPipelineId] = useState<string>('')
    const [stageId, setStageId] = useState<string>('')
    const [pipelines, setPipelines] = useState<Pipeline[]>([])
    const [stages, setStages] = useState<PipelineStage[]>([])

    // Typeahead States
    const [selectedContact, setSelectedContact] = useState<ContactType | null>(null)
    const [typeaheadInput, setTypeaheadInput] = useState('')

    // Debounce para inputs de texto individuales
    const [debouncedName, setDebouncedName] = useState('')
    const [debouncedDoc, setDebouncedDoc] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setDebouncedName(nameSearch), 300)
        return () => clearTimeout(t)
    }, [nameSearch])

    useEffect(() => {
        const t = setTimeout(() => setDebouncedDoc(docSearch), 300)
        return () => clearTimeout(t)
    }, [docSearch])

    // Cargar pipelines al montar
    useEffect(() => {
        pipelineApi.getAllPipelines()
            .then(data => setPipelines(data || []))
            .catch(() => setPipelines([]))
    }, [])

    // Cargar etapas cuando cambia el pipeline seleccionado
    useEffect(() => {
        if (pipelineId) {
            const selected = pipelines.find(p => String(p.id) === pipelineId)
            setStages(selected?.stages || [])
        } else {
            setStages([])
        }
        setStageId('')
    }, [pipelineId, pipelines])

    // Filtro reactivo acumulativo
    useEffect(() => {
        const filtered = tableData?.filter((c: any) => {
            // Filtro por selección directa en Typeahead Autocomplete
            if (selectedContact && c.id !== selectedContact.id) return false

            // Filtro por escritura predictiva (Nombre, Documento, Teléfono, Correo) si no se ha seleccionado contacto
            if (typeaheadInput && !selectedContact) {
                const query = typeaheadInput.toLowerCase()
                const matchesName = (c.name || '').toLowerCase().includes(query)
                const matchesDoc = (c.taxId || '').toLowerCase().includes(query)
                const matchesPhone = (c.phone || '').toLowerCase().includes(query)
                const matchesEmail = (c.email || '').toLowerCase().includes(query)
                if (!matchesName && !matchesDoc && !matchesPhone && !matchesEmail) return false
            }

            // Filtros individuales secundarios
            if (debouncedName && !(c.name || '').toLowerCase().includes(debouncedName.toLowerCase())) return false
            if (debouncedDoc && !(c.taxId || '').toLowerCase().includes(debouncedDoc.toLowerCase())) return false
            if (status === 'true' && c.isActive !== true) return false
            if (status === 'false' && c.isActive !== false) return false
            if (pipelineId && String(c.pipelineId) !== pipelineId) return false
            if (stageId && String(c.stageId) !== stageId) return false
            return true
        })
        setData(filtered)
    }, [selectedContact, typeaheadInput, debouncedName, debouncedDoc, status, pipelineId, stageId, tableData, setData])

    return (
        <CardContent>
            <Grid container spacing={4}>
                {/* Búsqueda Predictiva CRM / Typeahead Autocomplete */}
                <Grid item xs={12}>
                    <Autocomplete
                        fullWidth
                        options={tableData || []}
                        value={selectedContact}
                        onChange={(_, newValue) => setSelectedContact(newValue)}
                        inputValue={typeaheadInput}
                        onInputChange={(_, newInputValue) => setTypeaheadInput(newInputValue)}
                        getOptionLabel={(option) => option.name || ''}
                        noOptionsText="No se encontraron contactos"
                        renderInput={(params) => (
                            <CustomTextField
                                {...params}
                                label="Búsqueda Inteligente CRM (Nombre, Identificación, Teléfono o Email)"
                                placeholder="Escribe para buscar predictivamente..."
                                InputProps={{
                                    ...params.InputProps,
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <i className="tabler-search text-xl" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        )}
                        renderOption={(props, option) => {
                            const getTypeColor = (type: string) => {
                                const colors: Record<string, string> = {
                                    LEAD: '#2196f3',
                                    POTENTIAL_CUSTOMER: '#ff9800',
                                    CUSTOMER: '#4caf50',
                                    SUPPLIER: '#9c27b0',
                                    OTHER: '#9e9e9e'
                                }
                                return colors[type] || '#9e9e9e'
                            }

                            const getTypeLabel = (type: string) => {
                                const labels: Record<string, string> = {
                                    LEAD: 'Lead',
                                    POTENTIAL_CUSTOMER: 'Potencial',
                                    CUSTOMER: 'Cliente',
                                    SUPPLIER: 'Proveedor',
                                    OTHER: 'Otro'
                                }
                                return labels[type] || type
                            }

                            const typeColor = getTypeColor(option.type)

                            return (
                                <li {...props} key={option.id} style={{ padding: '8px 16px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                                        <Avatar sx={{ 
                                            bgcolor: typeColor + '15', 
                                            color: typeColor, 
                                            fontWeight: 600, 
                                            fontSize: '0.875rem',
                                            width: 32,
                                            height: 32
                                        }}>
                                            {(option.name || 'C').charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                    {option.name}
                                                </Typography>
                                                <Chip 
                                                    label={getTypeLabel(option.type)} 
                                                    size='small' 
                                                    sx={{ 
                                                        height: 18, 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 600,
                                                        bgcolor: typeColor + '15',
                                                        color: typeColor,
                                                        border: `1px solid ${typeColor}25`
                                                    }} 
                                                />
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                {option.taxId && (
                                                    <Typography variant='caption' color='text.secondary'>
                                                        ID: {option.taxId}
                                                    </Typography>
                                                )}
                                                {option.taxId && (option.phone || option.email) && <span style={{ color: 'var(--mui-palette-text-disabled)', fontSize: '0.75rem' }}>•</span>}
                                                {option.phone && (
                                                    <Typography variant='caption' color='text.secondary'>
                                                        Tel: {option.phone}
                                                    </Typography>
                                                )}
                                                {option.phone && option.email && <span style={{ color: 'var(--mui-palette-text-disabled)', fontSize: '0.75rem' }}>•</span>}
                                                {option.email && (
                                                    <Typography variant='caption' color='text.secondary'>
                                                        {option.email}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </li>
                            )
                        }}
                    />
                </Grid>

                {/* Filtros secundarios en una fila */}
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        label='Filtro por Nombre'
                        placeholder='Nombre...'
                        value={nameSearch}
                        onChange={e => setNameSearch(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        label='Filtro por Identificación'
                        placeholder='RUC / DNI...'
                        value={docSearch}
                        onChange={e => setDocSearch(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        select
                        fullWidth
                        label='Estado'
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        SelectProps={{ displayEmpty: true }}
                    >
                        <MenuItem value=''>Todos</MenuItem>
                        <MenuItem value='true'>Activo</MenuItem>
                        <MenuItem value='false'>Inactivo</MenuItem>
                    </CustomTextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        select
                        fullWidth
                        label='Embudo'
                        value={pipelineId}
                        onChange={e => setPipelineId(e.target.value)}
                        SelectProps={{ displayEmpty: true }}
                    >
                        <MenuItem value=''>Todos</MenuItem>
                        {pipelines.map(p => (
                            <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
                        ))}
                    </CustomTextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        select
                        fullWidth
                        label='Etapa'
                        value={stageId}
                        onChange={e => setStageId(e.target.value)}
                        SelectProps={{ displayEmpty: true }}
                        disabled={!pipelineId}
                    >
                        <MenuItem value=''>Todas</MenuItem>
                        {stages.map(s => (
                            <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                        ))}
                    </CustomTextField>
                </Grid>
            </Grid>
        </CardContent>
    )
}

export default TableFilters
