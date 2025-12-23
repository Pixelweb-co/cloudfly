import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Button from '@mui/material/Button'

interface ConfirmDialogProps {
    open: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    confirmColor?: 'primary' | 'error' | 'warning' | 'success'
    onConfirm: () => void
    onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = 'primary',
    onConfirm,
    onCancel
}) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            aria-labelledby='confirm-dialog-title'
            aria-describedby='confirm-dialog-description'
        >
            <DialogTitle id='confirm-dialog-title'>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id='confirm-dialog-description'>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions className='gap-2 p-4'>
                <Button onClick={onCancel} variant='outlined' color='secondary'>
                    {cancelText}
                </Button>
                <Button onClick={onConfirm} variant='contained' color={confirmColor} autoFocus>
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ConfirmDialog
