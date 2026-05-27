'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Divider,
  Stack
} from '@mui/material'
import { Icon } from '@iconify/react'
import { toast } from 'react-hot-toast'
import calendarService from '@/services/calendarService'
import { useSession } from 'next-auth/react'

interface ManageAppointmentDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  slot: any
}

const ManageAppointmentDialog = ({ open, onClose, onSuccess, slot }: ManageAppointmentDialogProps) => {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!slot?.appointmentId) {
      toast.error('No hay una cita asociada a este espacio')
      return
    }

    if (!window.confirm('¿Está seguro de que desea cancelar esta cita? El espacio quedará marcado como CANCELADO.')) {
      return
    }

    try {
      setLoading(true)
      const user = session?.user as any
      const tenantId = user?.tenantId || 1
      const companyId = user?.companyId || 1
      
      await calendarService.cancelAppointment(slot.appointmentId, tenantId, companyId)
      toast.success('Cita cancelada correctamente')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Error al cancelar la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleReprogram = () => {
    toast.error('La reprogramación estará disponible pronto. Por ahora, cancele y cree una nueva.')
  }

  if (!slot) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>
        <Box className='flex items-center justify-between'>
          <Typography variant='h6' className='font-bold'>Gestionar Cita</Typography>
          <IconButton size='small' onClick={onClose}><Icon icon='tabler:x' /></IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 6 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant='caption' color='textSecondary'>Horario</Typography>
            <Typography variant='body1' className='font-medium'>{slot.time}</Typography>
          </Box>
          <Box>
            <Typography variant='caption' color='textSecondary'>Contacto</Typography>
            <Typography variant='body1' className='font-medium'>{slot.contact}</Typography>
          </Box>
          <Box>
            <Typography variant='caption' color='textSecondary'>Servicio/Tipo</Typography>
            <Typography variant='body1' className='font-medium'>{slot.type}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 4, justifyContent: 'space-between' }}>
        <Button 
          color='error' 
          variant='outlined' 
          onClick={handleCancel}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <Icon icon='tabler:calendar-cancel' />}
        >
          Cancelar Cita
        </Button>
        <Box className='flex gap-2'>
          <Button onClick={onClose} color='secondary'>Cerrar</Button>
          <Button 
            variant='contained' 
            onClick={handleReprogram}
            disabled={loading}
            startIcon={<Icon icon='tabler:calendar-repeat' />}
          >
            Reprogramar
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default ManageAppointmentDialog
