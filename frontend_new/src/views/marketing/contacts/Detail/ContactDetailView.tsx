'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Grid, Typography, Box, CircularProgress, IconButton, Avatar, Card, Divider } from '@mui/material'
import ContactFormPanel from './ContactFormPanel'
import ChatInterface from './ChatInterface'
import { contactService } from '@/services/marketing/contactService'
import { pipelineService } from '@/services/marketing/pipelineService'
import { Contact } from '@/types/marketing/contactTypes'
import { Pipeline } from '@/types/marketing/pipelineTypes'
import { userMethods } from '@/utils/userMethods'
import toast from 'react-hot-toast'
import { Icon } from '@iconify/react'
import WhatsAppConfigForm from '@/views/apps/comunicaciones/canales/whatsapp/WhatsAppConfigForm'
import { axiosInstance } from '@/utils/axiosInstance'

export default function ContactDetailView() {
  const params = useParams()
  const router = useRouter()
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id
  const isNew = idStr === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [contact, setContact] = useState<Contact | null>(null)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [isEvolutionConnected, setIsEvolutionConnected] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)

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
        if (!isNew) {
          toast.error('Error cargando el contacto')
          router.push('/marketing/contacts/list')
        }
      } finally {
        setLoading(false)
      }
    }

    const checkWhatsAppStatus = async () => {
      try {
        const user = userMethods.getUserLogin()
        if (user && user.username) {
          const name = `cloudfly_${user.username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
          const res = await axiosInstance.get(`/api/evolution/status/${name}`)
          if (res.data && res.data.instance && res.data.instance.state === 'open') {
            setIsEvolutionConnected(true)
          }
        }
      } catch (err) {
        console.log('Evolution instance not active or not created')
      } finally {
        setIsCheckingConnection(false)
      }
    }

    fetchInitialData()
    checkWhatsAppStatus()
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
        router.replace(`/marketing/contacts/${newContact.id}`)
      } else if (contact) {
        const updated = await contactService.updateContact(contact.id, formData, companyId)
        setContact(updated)
        toast.success('Contacto actualizado correctamente')
      }
    } catch (error: any) {
      console.error('Save failed:', error)
      const message = error.response?.data?.message || error.message || 'Error al guardar el contacto'
      toast.error(message)
      throw error
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
          {isNew ? (
            <Box sx={{ p: 10, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
              <Icon icon="tabler:message-off" fontSize="3rem" style={{ opacity: 0.2 }} />
              <Typography variant="h6" sx={{ mt: 4, opacity: 0.5 }}>Guarda el contacto para iniciar un chat</Typography>
            </Box>
          ) : isCheckingConnection ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
              <CircularProgress size={40} />
              <Typography sx={{ mt: 4 }} color="text.secondary">Verificando conexión de WhatsApp...</Typography>
            </Box>
          ) : isEvolutionConnected ? (
            <ChatInterface contact={contact} isNew={isNew} />
          ) : !userMethods.isRole('USER') ? (
            <Card sx={{ height: '700px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 6, textAlign: 'center', boxShadow: 3 }}>
              <Box sx={{ mb: 6 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'rgba(var(--mui-palette-success-mainChannel) / 0.12)', color: 'success.main', mx: 'auto', mb: 4 }}>
                  <Icon icon="tabler:brand-whatsapp" fontSize="3rem" />
                </Avatar>
                <Typography variant="h5" color="error" gutterBottom className="font-semibold">
                  WhatsApp no conectado
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6 }}>
                  Para chatear con este contacto, primero debes activar tu canal de WhatsApp.
                </Typography>

                <Divider sx={{ mb: 6, width: '100%', opacity: 0.5 }}>Configuración Instantánea</Divider>

                <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                  <WhatsAppConfigForm onSuccess={() => setIsEvolutionConnected(true)} />
                </Box>
              </Box>
            </Card>
          )}
        </Grid>

      </Grid>

      <Box mt={6} />
    </Box>
  )
}
