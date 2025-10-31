'use client'

// React Imports
import {useRef, use, useEffect, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

import { PDFDownloadLink } from '@react-pdf/renderer';

import DialogContentText from '@mui/material/DialogContentText'

import MaintenanceReport from './reports/ReportMP'

import axiosInstance from '@/utils/axiosInterceptor'
import ReporteMantenimientoV from './reports/ReporteMantenimientoV'

const ReportViewver = ({open,onClose,rowSelect}:{open:boolean,onClose:any,rowSelect:any}) => {
  // States

  const printReport = () => {

    console.log('Imprimir reporte')
  }

  const handleClose = () => onClose()


  return (
    <>

      <Dialog
        fullScreen
        onClose={handleClose}
        aria-labelledby='full-screen-dialog-title'
        open={open}
        closeAfterTransition={false}
      >
        <DialogTitle id='alert-dialog-title'>Reporte:</DialogTitle>
        <DialogContent>

        <div>

            {rowSelect && <ReporteMantenimientoV data={rowSelect}/>}

        </div>



        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button onClick={handleClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ReportViewver
