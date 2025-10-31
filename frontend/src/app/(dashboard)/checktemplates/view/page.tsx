'use client'
import React, { useEffect, useState } from 'react'

import { Grid, Card, CardHeader, CardContent, Typography, TextField, Button, Box, Checkbox } from '@mui/material'

const ProductViewLayout = () => {
  // Estado inicial de los reportes
  const [reportes, setReportes] = useState([
    { id: 1, fecha: '2019-06-25', color: 'primary' },
    { id: 2, fecha: '2022-05-31', color: 'primary' },
    { id: 3, fecha: '2023-04-22', color: 'primary' },
    { id: 4, fecha: '2023-10-06', color: 'error' },
    { id: 5, fecha: '2024-04-03', color: 'error' },
    { id: 6, fecha: '2024-10-09', color: 'primary' }
  ])

  interface Product {
    productName: string;
    brand: string;
    model: string;
    productCode: string;
    invimaRegister: string;
    origin: string;
    location: string;
    voltage: string;
    amperage: string;
    power: string;
    frequency: string;
    manual: string;
    purchaseDate: string;
    bookValue: string;
    supplier: string;
    warranty: string;
    warrantyStartDate: string;
    warrantyEndDate: string;
    periodicity: string;
  }

  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    // Carga los datos del localStorage
    const storedProductView = localStorage.getItem('productview');
    const productData = storedProductView ? JSON.parse(storedProductView) : null;

    if (productData) {
      console.log('productData', productData)
      setProduct(productData) // Usa el primer producto para mostrar los datos
    }
  }, [])


  if (!product) {
    return <Typography>Cargando datos del producto...</Typography>
  }

  // Función para eliminar un reporte
  const eliminarReporte = (id:any) => {
    setReportes(reportes.filter(reporte => reporte.id !== id))
  }

  // Función para visualizar un reporte (puedes expandirla para mostrar contenido)
  const verReporte = (fecha:any) => {
    alert(`Visualizando reporte del ${fecha}`)
  }

  return (
    <Grid container spacing={2}>
      {/* Columna izquierda (30%) */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant='h6'>Contenido de la columna izquierda</Typography>
            <Typography>Imagen producto</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Columna derecha (70%) */}
      <Grid item xs={12} md={9}>
        <Card sx={{ mb: 2 }}>
          <CardHeader title='Dispositivo' />
          <CardContent className='flex  gap-4'>
            <Typography>
              <strong>Nombre:</strong> {product.productName}
            </Typography>
            <Typography>
              <strong>Marca:</strong> {product.brand}
            </Typography>
            <Typography>
              <strong>Modelo:</strong> {product.model}
            </Typography>
            <Typography>
              <strong>Serial:</strong> {product.productCode}
            </Typography>
            <Typography>
              <strong>Registro Invima:</strong> {product.invimaRegister}
            </Typography>
            <Typography>
              <strong>Procedencia:</strong> {product.origin}
            </Typography>
            <Typography>
              <strong>Ubicación:</strong> {product.location}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Datos Técnicos' />
          <CardContent className='flex  gap-4'>
            <Typography>
              <strong>Voltaje:</strong> {product.voltage}
            </Typography>
            <Typography>
              <strong>Amperios:</strong> {product.amperage}
            </Typography>
            <Typography>
              <strong>Potencia:</strong> {product.power}
            </Typography>
            <Typography>
              <strong>Frecuencia:</strong> {product.frequency}
            </Typography>
            <Typography>
              <strong>Manual de Usuario:</strong> {product.manual}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={12}>
        <Card sx={{ mb: 2 }}>
          <CardHeader title='Información Comercial' />
          <CardContent className='flex  gap-2'>
            <Typography>
              <strong>Fecha de Compra:</strong> {product.purchaseDate}
            </Typography>
            <Typography>
              <strong>Valor Contable:</strong> {product.bookValue}
            </Typography>
            <Typography>
              <strong>Proveedor:</strong> {product.supplier}
            </Typography>

            <Typography>
              <strong>Tiempo de Garantía:</strong> {product.warranty}
            </Typography>
            <Typography>
              <strong>Inicio Garantía:</strong> {product.warrantyStartDate}
            </Typography>
            <Typography>
              <strong>Finaliza Garantía:</strong> {product.warrantyEndDate}
            </Typography>
            <Typography>
              <strong>Periodicidad del Mantenimiento:</strong> {product.periodicity}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title='Protocolo de Mantenimiento' />
          <CardContent>
            <TextField fullWidth multiline rows={4} placeholder='Escribe el protocolo aquí...' sx={{ mb: 2 }} />
            <Button variant='contained' color='primary'>
              Guardar
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={12}>
        <Card>
          <CardHeader title='Documentos Anexos' />
          <CardContent>
            <Box display='flex' alignItems='center' sx={{ mb: 2 }}>
              <Button variant='outlined' component='label' sx={{ mr: 2 }}>
                Seleccionar archivo
                <input type='file' hidden />
              </Button>
              <TextField placeholder='Etiqueta' size='small' sx={{ flexGrow: 1, mr: 2 }} />
              <Checkbox />
              <Typography variant='body2' sx={{ mr: 2 }}>
                Reporte
              </Typography>
              <Button variant='contained' color='primary'>
                Cargar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={12}>
        <Card>
          <CardHeader title='Reportes de Mantenimiento' />
          <CardContent>
            <Box display='flex' flexWrap='wrap' gap={1}>
              {reportes.map(reporte => (
                <Box
                  key={reporte.id}
                  display='flex'
                  alignItems='center'
                  gap={1}
                  sx={{
                    backgroundColor: 'lightgray',
                    padding: 1,
                    borderRadius: 1
                  }}
                >
                  <Button
                    variant='contained'
                    color={reporte.color as 'primary' | 'error'}
                    onClick={() => verReporte(reporte.fecha)}
                    startIcon={<i className='fas fa-eye'></i>}
                  >
                    {reporte.fecha}
                  </Button>
                  <Button variant='contained' color='error' onClick={() => eliminarReporte(reporte.id)}>
                    <i className='tabler-trash text-textSecondary' />
                  </Button>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={12}>
        <Card>
          <CardHeader title='Herramientas' />
          <CardContent>
            <Box display='flex' gap={2}>
              <Button variant='contained'>Lista de Chequeo</Button>
              <Button variant='contained'>Firmas</Button>
              <Button variant='contained'>Editar</Button>
            </Box>
            <Typography variant='body2' sx={{ mt: 2 }}>
              Biomédico
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ProductViewLayout
