'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
  Box,
  Switch,
  FormControlLabel
} from '@mui/material'
import { contactService } from '@/services/marketing/contactService'
import { Contact, ContactCreateRequest } from '@/types/marketing/contactTypes'
import { Pipeline, PipelineStage } from '@/types/marketing/pipelineTypes'
import { userMethods } from '@/utils/userMethods'
import toast from 'react-hot-toast'
import { Icon } from '@iconify/react'

interface Props {
  open: boolean;
  handleClose: () => void;
  selectedContact: Contact | null;
  pipelines: Pipeline[];
  onSuccess: () => void;
}

export default function ContactForm({ open, handleClose, selectedContact, pipelines, onSuccess }: Props) {
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
    isActive: true
  })
  const [saving, setSaving] = useState(false)
  const [availableStages, setAvailableStages] = useState<PipelineStage[]>([])

  useEffect(() => {
    if (selectedContact) {
      setFormData({
        name: selectedContact.name,
        email: selectedContact.email || '',
        phone: selectedContact.phone || '',
        address: selectedContact.address || '',
        taxId: selectedContact.taxId || '',
        type: selectedContact.type || 'LEAD',
        stage: selectedContact.stage || 'LEAD',
        pipelineId: selectedContact.pipelineId,
        stageId: selectedContact.stageId,
        documentType: selectedContact.documentType || 'CC',
        documentNumber: selectedContact.documentNumber || '',
        isActive: selectedContact.isActive
      })
      
      // Load stages if pipeline exists
      if (selectedContact.pipelineId) {
        const pipeline = pipelines.find(p => p.id === selectedContact.pipelineId)
        if (pipeline && pipeline.stages) {
          setAvailableStages(pipeline.stages)
        }
      }
    } else {
      setFormData({
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
        isActive: true
      })
      setAvailableStages([])
    }
  }, [selectedContact, open, pipelines])

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
    if (!formData.name) {
      toast.error('El nombre es obligatorio')
      return
    }

    try {
      setSaving(true)
      const user = userMethods.getUserLogin()
      const companyId = user?.activeCompanyId || user?.company_id
      
      if (selectedContact) {
        await contactService.updateContact(selectedContact.id, formData, companyId)
        toast.success('Contacto actualizado')
      } else {
        await contactService.createContact(formData, companyId)
        toast.success('Contacto creado')
      }
      onSuccess()
      handleClose()
    } catch (e) {
      console.error('Error al guardar contacto:', e)
      toast.error('Error al guardar el contacto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {selectedContact ? 'Editar Contacto' : 'Nuevo Contacto'}
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" sx={{ mb: 4, mt: 2 }}>Información General</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre Completo / Razón Social"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono / WhatsApp"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Dirección"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 6 }} />
        <Typography variant="subtitle2" sx={{ mb: 4 }}>Identificación y Clasificación</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Número de Documento"
              value={formData.documentNumber}
              onChange={e => setFormData({ ...formData, documentNumber: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
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
        <Typography variant="subtitle2" sx={{ mb: 4 }}>Pipeline y Seguimiento</Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
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
                />
              }
              label="Contacto Activo"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 5 }}>
        <Button onClick={handleClose} color="secondary">Cancelar</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={saving}
          startIcon={saving && <Icon icon="tabler:refresh" className="animate-spin" />}
        >
          {selectedContact ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
