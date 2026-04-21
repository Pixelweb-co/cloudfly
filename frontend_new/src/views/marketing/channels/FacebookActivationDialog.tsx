'use client'

import { Dialog, DialogContent, DialogTitle, Typography, IconButton } from '@mui/material'
import FacebookSetupForm from './FacebookSetupForm'

interface Props {
    open: boolean
    onClose: () => void
    accessToken: string
    onComplete: () => void
}

const FacebookActivationDialog = ({ open, onClose, accessToken, onComplete }: Props) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth='sm' 
            fullWidth
            scroll='body'
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 4 }}>
                <Typography variant='h4' sx={{ fontWeight: 600 }}>Configurar Facebook Messenger</Typography>
                <IconButton onClick={onClose} size='small'>
                    <i className='tabler-x' />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4, pt: 0 }}>
                <FacebookSetupForm 
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

export default FacebookActivationDialog
