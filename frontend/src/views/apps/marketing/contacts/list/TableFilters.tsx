'use client'

import { useState, useEffect, useCallback } from 'react'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
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

    // Debounce para inputs de texto
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
            if (debouncedName && !(c.name || '').toLowerCase().includes(debouncedName.toLowerCase())) return false
            if (debouncedDoc && !(c.taxId || '').toLowerCase().includes(debouncedDoc.toLowerCase())) return false
            if (status === 'true' && c.isActive !== true) return false
            if (status === 'false' && c.isActive !== false) return false
            if (pipelineId && String(c.pipelineId) !== pipelineId) return false
            if (stageId && String(c.stageId) !== stageId) return false
            return true
        })
        setData(filtered)
    }, [debouncedName, debouncedDoc, status, pipelineId, stageId, tableData, setData])

    return (
        <CardContent>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        label='Buscar por Nombre'
                        placeholder='Nombre del contacto...'
                        value={nameSearch}
                        onChange={e => setNameSearch(e.target.value)}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                    <CustomTextField
                        fullWidth
                        label='Documento de Identidad'
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
