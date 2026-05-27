import Image from 'next/image'
import Uploader from '@/components/uploader'
import { userMethods } from '@/utils/userMethods'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { Dialog, DialogTitle, DialogContent, Card, Alert, Tab, CardContent, Grid, Box, DialogActions, Button, Typography } from '@mui/material'
import React, { SyntheticEvent, useEffect, useState } from 'react'

export default function MediaModal({ open, onClose }: any) {
  const [valueT, setValueT] = useState('biblioteca')
  const handleTabChange = (event: SyntheticEvent, newValue: string) => setValueT(newValue)
  const [mediaItems, setMediaItems] = useState<any[]>([])
  const [selectedMedia, setSelectedMedia] = useState<any[]>([])


  const user = userMethods.getUserLogin();
  const id_customer = user.customer.id

  const getMediaItems = async () => {

    try {
      const token = localStorage.getItem('AuthToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/tenant/${id_customer}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMediaItems(data)
      } else {
        console.error('Error fetching media items')
      }
    } catch (error) {
      console.error('Error fetching media items:', error)
    }
  }


  useEffect(() => {

    getMediaItems()
  }, [])


  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>Seleccionar imagenes</DialogTitle>

      <DialogContent>
        <Card>

          <TabContext value={valueT}>
            <TabList variant='scrollable' onChange={handleTabChange} className='border-be'>
              <Tab label='Bibioteca de medios' value='biblioteca' />
              <Tab label='Subir archivos' value='upload' />
            </TabList>

            <CardContent>
              <TabPanel value='biblioteca'>
                {mediaItems.length === 0 ? (
                  <Typography>No hay imágenes en la biblioteca.</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {mediaItems.map(item => (
                      <Grid item xs={6} sm={4} md={3} key={item.id}>
                        <Box
                          sx={{
                            border: selectedMedia.find(d => d.id === item.id) ? '2px solid blue' : '1px solid #eee',
                            borderRadius: 2,
                            p: 1,
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 }
                          }}
                          onClick={() => {
                            // lógica para seleccionar/deseleccionar
                            if (selectedMedia.find(d => d.id === item.id)) {
                              setSelectedMedia(selectedMedia.filter(media => media.id !== item.id))
                            } else {
                              setSelectedMedia([...selectedMedia, item])
                            }
                          }}
                        >
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_URL}${item.url}`}
                            alt={item.originalFilename || 'Media Item'}
                            width={150}
                            height={150}
                            style={{ objectFit: 'cover', borderRadius: 8 }}
                            unoptimized // para pruebas, evita optimización de Next
                          />
                          <Typography variant='body2' sx={{ mt: 1 }} noWrap>
                            {item.originalFilename}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </TabPanel>

              {/* upload */}
              <TabPanel value='upload'>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={12}>

                    <div style={{ flexDirection: 'column', border: '2px dashed #ccc', borderRadius: '8px', padding: '5px', textAlign: 'center', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                      <Uploader
                        tenantId={id_customer}
                        onUploaded={ids => {
                          console.log('Ids recibidos del backend:', ids)
                          // aquí cambiar a la tab de biblioteca y refrescar la lista
                          setValueT('biblioteca')
                            getMediaItems()
                       
                       
                        }}
                      />
                    </div>

                  </Grid>
                </Grid>
              </TabPanel>



            </CardContent>
          </TabContext>

        </Card>
      </DialogContent>
      <Box component='form' sx={{ mt: 2 }}>
        <DialogActions>
          <Button color='error' onClick={() => setSelectedMedia([])}>
            Limpiar seleccion
          </Button>
          <Button onClick={onClose} color='secondary'>
            Cerrar
          </Button>
          <Button type='submit' variant='contained' color='primary' 
          disabled={selectedMedia.length === 0}
          onClick={() => {
          
            onClose(selectedMedia)
          }}>
            Agregar imagenes seleccionadas ({selectedMedia.length})
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
