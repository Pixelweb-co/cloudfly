'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, Grid, Button, Typography, MenuItem } from '@mui/material'
import CustomTextField from '@core/components/mui/TextField'
import { Icon } from '@iconify/react'
import { SendingList } from '@/types/marketing/sendingListTypes'

interface Props {
  list: SendingList | null
  onSave: (data: any) => Promise<void>
  saving: boolean
}

export default function SendingListFormPanel({ list, onSave, saving }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    if (list) {
      setFormData({
        name: list.name || '',
        description: list.description || '',
        status: list.status || 'ACTIVE'
      })
    }
  }, [list])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <Card>
      <CardHeader 
        title='Información de la Lista' 
        subheader='Segmentación manual de contactos'
        avatar={<Icon icon='tabler:list-details' fontSize='1.5rem' />}
      />
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                label='Nombre de la Lista'
                placeholder='Ej: Clientes VIP Mayo'
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                fullWidth
                multiline
                rows={4}
                label='Descripción'
                placeholder='Propósito de esta segmentación...'
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <CustomTextField
                select
                fullWidth
                label='Estado'
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value='ACTIVE'>Activa</MenuItem>
                <MenuItem value='INACTIVE'>Inactiva</MenuItem>
                <MenuItem value='ARCHIVED'>Archivada</MenuItem>
              </CustomTextField>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  type='submit' 
                  variant='contained' 
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <Icon icon='tabler:device-floppy' />}
                >
                  Guardar Cambios
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

import { Box, CircularProgress } from '@mui/material'
