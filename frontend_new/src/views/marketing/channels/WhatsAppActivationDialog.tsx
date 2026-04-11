'use client'

import { Dialog, DialogContent, DialogTitle, Button, Typography, Box, IconButton } from '@mui/material'
import WhatsAppSetupForm from './WhatsAppSetupForm'

interface Props {
    open: boolean
    onClose: () => void
    accessToken: string
    onComplete: () => void
}

const WhatsAppActivationDialog = ({ open, onClose, accessToken, onComplete }: Props) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth='md' 
            fullWidth
            scroll='body'
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 4 }}>
                <Typography variant='h4' sx={{ fontWeight: 600 }}>Configuración de WhatsApp Evolution</Typography>
                <IconButton onClick={onClose}>
                    <i className='tabler-x' />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4, pt: 0 }}>
                <WhatsAppSetupForm 
                    accessToken={accessToken}
                    onComplete={() => {
                        onComplete()
                        onClose()
                    }}
                    onCancel={onClose}
                />
            </DialogContent>
        </Dialog>
    )
}

export default WhatsAppActivationDialog
