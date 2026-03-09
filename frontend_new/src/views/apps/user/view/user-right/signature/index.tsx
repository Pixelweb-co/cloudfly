// MUI Imports
import Grid from '@mui/material/Grid'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'

import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import axios from 'axios'
import dotenv from "dotenv";

import { image } from 'html2canvas/dist/types/css/types/image'
import { userMethods } from '@/utils/userMethods'
import { useEffect, useState } from 'react'
import CustomTextField from '@/@core/components/mui/TextField'
import Card from '@mui/material/Card'
import Image from 'next/image'
import { Alert, Box, Button, CardContent, CardHeader } from '@mui/material'

const schema = yup.object().shape({
  image: yup.string().notRequired()
})

const Signature = ({ data }: { data?: PricingPlanType[] }) => {
  const [selectedFile, setSelectedFile] = useState(null)

    const handleFileChange = (event:any) => {
      // Obtiene el archivo seleccionado
      setSelectedFile(event.target.files[0])
    }

    const [editData, setEditData] = useState<any>({
      image:''
    })

     const {
        control,
        handleSubmit,
        formState: { errors, isSubmitted },
        setValue,
        reset
      } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
          image: ''
        },
        mode: 'onSubmit'
      })


      const onSubmit = async (data: any) => {
        console.log('sunnii')

        const formData = new FormData()



        // Agregar el archivo de imagen al FormData
        if (selectedFile) {
          formData.append(
            'user',
            JSON.stringify(userMethods.getUserLogin())
          )
          console.log('selectedFile ', selectedFile)
          formData.append('file', selectedFile)


        try {
          const token = localStorage.getItem('AuthToken')

          console.log('token ', token)

          if (!token) {
            throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
          }

          // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo

          const method = 'post' // Actualización o Creación
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/firma-user`

          const response = await axios({
            method: method, // Usa 'put' para actualización o 'post' para creación
            url: apiUrl,
            data: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`
            }
          })

          // Procesar la respuesta
          if (response.data) {
            console.log('firma guardado con éxito:', response.data)




            setTimeout(()=>fetchOptions(),500)

            // Aquí puedes redirigir o mostrar un mensaje de éxito
          } else {
            console.error('Error en la respuesta:', response.data.message)
          }




        } catch (error) {
          console.error('Error al enviar los datos:', error)
        }

      }

      }

        useEffect(() => {
          console.log('errors ', errors)
        }, [errors])


        const fetchOptions = async () => {
          console.log('fetchOptions')

          try {
            const token = localStorage.getItem('AuthToken')

            if (!token) {
              throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
            }

            const user = userMethods.getUserLogin();

            const [firmaRes] = await Promise.all([
              axios.get(`${process.env.NEXT_PUBLIC_API_URL}/firma-user/sign/${user.id}`, {
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                }
              })
            ])

            setEditData({
              image: firmaRes.data.firma
            })


            return true
          } catch (error) {
            console.error('Error al obtener datos:', error)
          }
        }

        useEffect(() => {
          fetchOptions()

        }, [])

  return (

    <Card>
    <CardHeader title='Firma' />
    <CardContent>
     {isSubmitted && Object.keys(errors).length > 0 && <Alert severity='error' className='mb-4'>El formulario contiene errores, corrigelos y intenta de nuevo</Alert>}
     {isSubmitted && Object.keys(errors).length === 0 && <Alert severity='success' className='mb-4'>Se ha guardado la firma correctamente</Alert>}

    <Grid container spacing={6}>
      <Grid item xs={12}>
                    <Controller
                      name='image'
                      control={control}
                      render={({ field }) => (
                        <CustomTextField
                          fullWidth
                          type='file'
                          label='Imagen de la firma'
                          onChange={handleFileChange}
                          error={Boolean(errors.image)}
                          helperText={errors.image?.message}
                        />
                      )}
                    />

                    {editData.image && (
                        <Card>
                        <Image src={`${process.env.NEXT_PUBLIC_API_URL}/firma-user/${editData.image}`} width={150} height={150} alt="Firma de usuario" />
                       </Card>
                    )}

              <Box component='form' onSubmit={handleSubmit(onSubmit)} sx={{ mt: 2 }}>
                      <Button className='mt-2' type='submit' variant='contained' color='primary'>Guardar firma</Button>
                  </Box>
                  </Grid>
                </Grid>

                </CardContent>
                </Card>

  )
}

export default Signature
