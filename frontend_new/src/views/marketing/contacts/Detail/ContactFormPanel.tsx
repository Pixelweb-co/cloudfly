'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Box,
  InputAdornment
} from '@mui/material'
import { Contact, ContactCreateRequest } from '@/types/marketing/contactTypes'
import { Pipeline, PipelineStage } from '@/types/marketing/pipelineTypes'
import { Icon } from '@iconify/react'

interface Props {
  contact: Contact | null;
  pipelines: Pipeline[];
  onSave: (data: ContactCreateRequest) => Promise<void>;
  saving: boolean;
}

export default function ContactFormPanel({ contact, pipelines, onSave, saving }: Props) {
  const [formData, setFormData] = useState<ContactCreateRequest>({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    type: 'LEAD',
    stage: 'LEAD',
    pipelineId: undefined,
    stageId: undefined,
    documentType: 'CC',
    documentNumber: '',
    countryPrefix: '+57',
    isActive: true
  })
  const [availableStages, setAvailableStages] = useState<PipelineStage[]>([])

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        taxId: contact.taxId || '',
        type: contact.type || 'LEAD',
        stage: contact.stage || 'LEAD',
        pipelineId: contact.pipelineId,
        stageId: contact.stageId,
        documentType: contact.documentType || 'CC',
        documentNumber: contact.documentNumber || '',
        countryPrefix: contact.phone?.startsWith('+') ? contact.phone.substring(0, contact.phone.length - 10) || '+57' : '+57',
        isActive: contact.isActive !== undefined ? contact.isActive : true
      })
      
      // If phone exists, try to extract prefix (this is a simple heuristic, usually better to store prefix separately)
      if (contact.phone && contact.phone.startsWith('+')) {
          // Simple logic: if it's +57XXXXXXXXXX 
          // We'll just default to +57 for now unless we have a more robust way
      }

      if (contact.pipelineId) {
        const pipeline = pipelines.find(p => p.id === contact.pipelineId)
        if (pipeline && pipeline.stages) {
          setAvailableStages(pipeline.stages)
        }
      }
    }
  }, [contact, pipelines])

  const handlePipelineChange = (pipelineId: number) => {
    const pipeline = pipelines.find(p => p.id === pipelineId)
    setFormData(prev => ({ ...prev, pipelineId, stageId: undefined }))
    if (pipeline && pipeline.stages) {
      setAvailableStages(pipeline.stages)
    } else {
      setAvailableStages([])
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) return
    
    // Concatenate prefix and phone for the backend/WhatsApp
    const fullPhone = `${formData.countryPrefix}${formData.phone.replace(/\D/g, '')}`
    
    await onSave({
      ...formData,
      phone: fullPhone
    })
  }

  const COUNTRY_CODES = [
    { value: '+57', label: '🇨🇴 +57' },
    { value: '+1', label: '🇺🇸 +1' },
    { value: '+34', label: '🇪🇸 +34' },
    { value: '+52', label: '🇲🇽 +52' },
    { value: '+54', label: '🇦🇷 +54' },
    { value: '+56', label: '🇨🇱 +56' },
    { value: '+51', label: '🇵🇪 +5 Peru' },
    { value: '+58', label: '🇻🇪 +58' },
    { value: '+507', label: '🇵🇦 +507' },
    { value: '+593', label: '🇪🇨 +593' },
  ]

  return (
    <Card>
      <CardHeader 
        title="Datos del Contacto" 
        titleTypographyProps={{ variant: 'h5' }}
        sx={{ borderBottom: 1, borderColor: 'divider', pb: 4 }}
      />
      <CardContent sx={{ pt: 6 }}>
        <Typography variant="subtitle2" sx={{ mb: 4 }} color="text.secondary">
          Información General
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre Completo / Razón Social *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono / WhatsApp"
              placeholder="3001234567"
              value={formData.phone.replace(formData.countryPrefix || '', '')}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Select
                      value={formData.countryPrefix || '+57'}
                      onChange={e => setFormData({ ...formData, countryPrefix: e.target.value as string })}
                      variant="standard"
                      sx={{ 
                        '& .MuiSelect-select': { py: 0, pl: 0, pr: '20px !important' },
                        '&:before, &:after': { display: 'none' }
                      }}
                    >
                      {COUNTRY_CODES.map(c => (
                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                      ))}
                    </Select>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              multiline
              rows={2}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 6 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 4 }} color="text.secondary">
          Identificación y Clasificación
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                label="Tipo de Documento"
                value={formData.documentType}
                onChange={e => setFormData({ ...formData, documentType: e.target.value })}
              >
                <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
                <MenuItem value="NIT">NIT</MenuItem>
                <MenuItem value="CE">Cédula de Extranjería</MenuItem>
                <MenuItem value="PP">Pasaporte</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Documento"
              value={formData.documentNumber}
              onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Contacto</InputLabel>
              <Select
                label="Tipo de Contacto"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <MenuItem value="LEAD">Lead / Prospecto</MenuItem>
                <MenuItem value="CLIENT">Cliente</MenuItem>
                <MenuItem value="VENDOR">Proveedor</MenuItem>
                <MenuItem value="OTHER">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6 }} />
        
        <Typography variant="subtitle2" sx={{ mb: 4 }} color="text.secondary">
          Pipeline y Seguimiento
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Embudo (Pipeline)</InputLabel>
              <Select
                label="Embudo (Pipeline)"
                value={formData.pipelineId || ''}
                onChange={e => handlePipelineChange(Number(e.target.value))}
              >
                <MenuItem value=""><em>Ninguno</em></MenuItem>
                {pipelines.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth disabled={!formData.pipelineId}>
              <InputLabel>Etapa Actual</InputLabel>
              <Select
                label="Etapa Actual"
                value={formData.stageId || ''}
                onChange={e => setFormData({ ...formData, stageId: Number(e.target.value) })}
              >
                <MenuItem value=""><em>Seleccionar Etapa</em></MenuItem>
                {availableStages.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                  color="success"
                />
              }
              label={formData.isActive ? "Contacto Activo" : "Contacto Inactivo"}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions sx={{ px: 6, pb: 6, pt: 2, justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider', mt: 4 }}>
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={saving || !formData.name}
          startIcon={saving ? <Icon icon="tabler:loader" className="animate-spin" /> : <Icon icon="tabler:device-floppy" />}
        >
          {contact ? 'Actualizar Ficha' : 'Crear Contacto'}
        </Button>
      </CardActions>
    </Card>
  )
}
