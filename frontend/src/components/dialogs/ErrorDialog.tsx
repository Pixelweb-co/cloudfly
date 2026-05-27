// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'

const ErrorDialog = ({entitYName,open,error,setOpen}:{ entitYName:string,open:any,error:any,setOpen:any}) => {

  const handleClose = () => setOpen(false)

  return (

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby='alert-dialog-title'
        aria-describedby='alert-dialog-description'
        closeAfterTransition={false}
      >
        <DialogTitle id='alert-dialog-title'>{entitYName}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Error: {error}
          </DialogContentText>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>

  )
}

export default ErrorDialog
