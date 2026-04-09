'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Grid, Typography, Box, CircularProgress, IconButton } from '@mui/material'
import ContactFormPanel from './ContactFormPanel'
import ChatInterface from './ChatInterface'
import { contactService } from '@/services/marketing/contactService'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Contact } from '@/types/marketing/contactTypes'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import { userMethods } from '@/utils/userMethods'
import toast from 'react-hot-toast'
import { Icon } from '@iconify/react'

export default function ContactDetailView() {
  const params = useParams()
  const router = useRouter()
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id
  const isNew = idStr === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [contact, setContact] = useState<Contact | null>(null)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = userMethods.getUserLogin()
        const tenantId = user?.customerId || user?.tenant_id
        const companyId = user?.activeCompanyId || user?.company_id

        // Fetch pipelines — don't redirect if this fails
        try {
          const pips = await pipelineService.getAllPipelines(tenantId, companyId)
          setPipelines(pips)
        } catch (pipErr) {
          console.warn('Could not load pipelines (non-critical):', pipErr)
        }

        if (!isNew && idStr) {
          const fetchedContact = await contactService.getContactById(Number(idStr), companyId)
          if (fetchedContact) {
            setContact(fetchedContact)
          } else {
            toast.error('Contacto no encontrado')
            router.push('/marketing/contacts/list')
          }
        }
      } catch (err) {
        console.error('Error fetching contact:', err)
        // Only redirect on edit mode failures, not for new contact form
        if (!isNew) {
          toast.error('Error cargando el contacto')
          router.push('/marketing/contacts/list')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchInitialData()
  }, [idStr, isNew, router])

  const goBack = () => router.push('/marketing/contacts/list')

  const handleSaveContact = async (formData: any) => {
    try {
      setSaving(true)
      const user = userMethods.getUserLogin()
      const companyId = user?.activeCompanyId || user?.company_id
      
      if (isNew) {
        const newContact = await contactService.createContact(formData, companyId)
        toast.success('Contacto creado exitosamente')
        // Al crear, queremos redirigir a la vista de ese contacto ya creado (con chat activo)
        router.replace(`/marketing/contacts/${newContact.id}`)
      } else if (contact) {
        const updated = await contactService.updateContact(contact.id, formData, companyId)
        setContact(updated)
        toast.success('Contacto actualizado correctamente')
      }
    } catch (error) {
      console.error('Save failed:', error)
      toast.error('Error al guardar el contacto')
      throw error // Lanzar error para que el panel detenga spinner
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={6} gap={3}>
        <IconButton onClick={goBack} sx={{ bgcolor: 'action.hover' }}>
          <Icon icon="tabler:arrow-left" />
        </IconButton>
        <Box>
          <Typography variant="h4" className="font-semibold text-textPrimary">
            {isNew ? 'Nuevo Contacto' : 'Ficha Técnica'}
          </Typography>
          {!isNew && contact && (
            <Typography variant="body2" color="text.secondary">
              Gestiona los datos y comunicaciones de {contact.name}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Main Grid Layout */}
      <Grid container spacing={6}>
        
        {/* Left Column: Form */}
        <Grid item xs={12} lg={5}>
          <ContactFormPanel 
            contact={contact} 
            pipelines={pipelines} 
            onSave={handleSaveContact} 
            saving={saving}
          />
        </Grid>

        {/* Right Column: Chat/Activity */}
        <Grid item xs={12} lg={7}>
          <ChatInterface contact={contact} isNew={isNew} />
        </Grid>

      </Grid>
      
      {/* Future Expansion Row */}
      <Box mt={6} />
    </Box>
  )
}
