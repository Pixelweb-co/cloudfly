// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'

const ConfirmationDialog = ({entitYName,name,open,onConfirmation,setOpen}:{name:string, entitYName:string,open:any,onConfirmation:any,setOpen:any}) => {

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
            Esta seguro de eliminar este elemento?
          </DialogContentText>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button onClick={handleClose}>Cerrar</Button>
          <Button onClick={()=>onConfirmation(name)}>Eliminar</Button>
        </DialogActions>
      </Dialog>

  )
}

export default ConfirmationDialog
