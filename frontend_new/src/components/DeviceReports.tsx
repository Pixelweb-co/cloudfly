import React, {useState, useEffect } from 'react';

import axios from 'axios';
import dotenv from "dotenv";

import { Box, Button, Card, CardContent, CardHeader, Tooltip } from '@mui/material';
import { userMethods } from '@/utils/userMethods';
import ReportViewver from './ReportViewver';
import { axiosInstance } from '@/utils/axiosInstance';
import ConfirmationDialog from '@components/dialogs/ConfirmationDialog';

function DeviceReports({product_id}:{product_id:any}) {
  const [reportes, setReportes] = useState<any[]>([]);
  const [openReport, setOpenReport] = useState(false);
  const [rowSelect, setRowSelect] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const verReporte = (reporte:any) => {
    console.log('Ver reporte:', reporte);
    setRowSelect(reporte)
    setOpenReport(true)
  }

  const eliminarReporte = async (id:any) => {
    console.log('Eliminar reporte:', id);

      await axiosInstance.delete(`${process.env.NEXT_PUBLIC_API_URL}/reportes/${id}`)

      fetchOptions()


  }

  const fetchOptions = async () => {
    console.log('fetchOptions')

    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const [reportsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/solicitudes/finalizadas/${product_id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])

      setReportes(reportsRes.data)

    } catch (error) {
      console.error('Error al obtener los datos:', error)
    }
  }


  useEffect(() => {

    fetchOptions()

  }, []);

  return (
    <>
    <Card>
    <CardHeader title='Reportes de Mantenimiento y Calibración' />
    <CardContent>
      <Box display='flex' flexWrap='wrap' gap={1}>
      {reportes.map((reporte,index) => (
        <Box
        key={index}
        display='flex'
        alignItems='center'
        gap={1}
        sx={{
          backgroundColor:reporte.color,
          padding: 1,
          borderRadius: 1
        }}
        >
        <Tooltip title={`${reporte.nombreTipoServicio}`}>
          <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            color="primary"
            sx={{backgroundColor:"white",minWidth: 100}}
            onClick={() => verReporte(reporte)}
            startIcon={<i className='tabler-eye'></i>}
          >
            {reporte.fecha}
          </Button>

          {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('ADMIN')) && <Button variant='outlined'sx={{backgroundColor:"white"}} onClick={() => {
            setOpen(true)
            setRowSelect(reporte)
            console.log("rpd",reporte)
          }}>
            <i className='tabler-trash' />
          </Button>}
          </Box>
        </Tooltip>
        </Box>
      ))}
      </Box>


    </CardContent>
    </Card>
    <ConfirmationDialog
    open={open}
    setOpen={(p:any) => setOpen(p)}
    entitYName='Reporte'
    onConfirmation ={()=>{
      eliminarReporte(rowSelect?.idSolicitud)
      setOpen(false)
    }}
    name={rowSelect?.nombreTipoServicio}
    />
    {openReport && <ReportViewver
    open={openReport}
    onClose={() => setOpenReport(false)}
    rowSelect={rowSelect}
    />}
    </>
  );
}

export default DeviceReports;
