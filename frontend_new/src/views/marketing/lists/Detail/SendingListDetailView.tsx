'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Grid, Typography, Box, CircularProgress, IconButton } from '@mui/material'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { sendingListService } from '@/services/marketing/sendingListService'
import { SendingList } from '@/types/marketing/sendingListTypes'
import SendingListFormPanel from './SendingListFormPanel'
import SendingListContactsPanel from './SendingListContactsPanel'

export default function SendingListDetailView() {
  const params = useParams()
  const router = useRouter()
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id
  const isNew = idStr === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [list, setList] = useState<SendingList | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (isNew) return
      try {
        setLoading(true)
        const data = await sendingListService.getById(Number(idStr))
        setList(data)
      } catch (err) {
        console.error('Error fetching list:', err)
        toast.error('Error al cargar la lista')
        router.push('/marketing/lists/list')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [idStr, isNew, router])

  const handleSave = async (formData: any) => {
    try {
      setSaving(true)
      const activeTenantId = localStorage.getItem('activeTenantId')
      const activeCompanyId = localStorage.getItem('activeCompanyId')
      const dataWithContext = {
        ...formData,
        tenantId: activeTenantId ? Number(activeTenantId) : undefined,
        companyId: activeCompanyId ? Number(activeCompanyId) : undefined
      }

      if (isNew) {
        const newList = await sendingListService.create(dataWithContext)
        toast.success('Lista creada exitosamente')
        router.replace(`/marketing/lists/${newList.id}`)
      } else if (list) {
        const updated = await sendingListService.update(list.id, dataWithContext)
        setList(updated)
        toast.success('Lista actualizada correctamente')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar la lista')
    } finally {
      setSaving(false)
    }
  }

  const refreshList = async () => {
    if (isNew) return
    try {
      const data = await sendingListService.getById(Number(idStr))
      setList(data)
    } catch (err) {
      console.error('Error refreshing list:', err)
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
      <Box display="flex" alignItems="center" mb={6} gap={3}>
        <IconButton onClick={() => router.push('/marketing/lists/list')} sx={{ bgcolor: 'action.hover' }}>
          <Icon icon="tabler:arrow-left" />
        </IconButton>
        <Box>
          <Typography variant="h4" className="font-semibold text-textPrimary">
            {isNew ? 'Nueva Lista de Envío' : `Lista: ${list?.name}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isNew ? 'Crea una nueva segmentación manual' : 'Gestiona los miembros y detalles de la lista'}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={6}>
        <Grid item xs={12} lg={4}>
          <SendingListFormPanel 
            list={list} 
            onSave={handleSave} 
            saving={saving} 
          />
        </Grid>
        
        <Grid item xs={12} lg={8}>
          {!isNew && (
            <SendingListContactsPanel 
              listId={Number(idStr)} 
              onMemberChange={refreshList} 
            />
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

