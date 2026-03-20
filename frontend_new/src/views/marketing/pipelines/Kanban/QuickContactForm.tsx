'use client'

import React, { useState } from 'react'
import { Box, TextField, Button, Grid, CircularProgress, Alert } from '@mui/material'

interface Props {
  onCancel: () => void
  onCreated: (contactId: number) => void
}

export default function QuickContactForm({ onCancel, onCreated }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // Mock API call to create contact
      console.log('Creating contact mock:', formData)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockedNewContactId = Math.floor(Math.random() * 1000)
      onCreated(mockedNewContactId)
    } catch (err: any) {
      setError(err.message || 'Error al crear contacto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}
      
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Nombre Completo"
            name="name"
            placeholder="Ej: Juan Pérez"
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            placeholder="juan@ejemplo.com"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Teléfono"
            name="phone"
            placeholder="+57 300 123 4567"
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Empresa"
            name="company"
            placeholder="Nombre de la empresa"
            value={formData.company}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mt: 7 }}>
        <Button onClick={onCancel} disabled={loading} color="secondary">
          Volver
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={loading || !formData.name || !formData.phone}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Crear Contacto'}
        </Button>
      </Box>
    </Box>
  )
}
