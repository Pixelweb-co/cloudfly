'use client'

import { Dialog, DialogContent, DialogTitle, Typography, IconButton } from '@mui/material'
import WhatsAppConfigForm from '@/views/apps/comunicaciones/canales/whatsapp/WhatsAppConfigForm'
import type { Channel } from '@/types/marketing'

interface Props {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const WhatsAppManagementDialog = ({ open, onClose, onComplete }: Props) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth='sm' 
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 4 }}>
        <Typography variant='h4' sx={{ fontWeight: 600 }}>Gestionar WhatsApp</Typography>
        <IconButton onClick={onClose} size='small'>
          <i className='tabler-x' />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 4, pt: 0 }}>
        <WhatsAppConfigForm 
          onSuccess={() => {
            onComplete()
            onClose()
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export default WhatsAppManagementDialog
