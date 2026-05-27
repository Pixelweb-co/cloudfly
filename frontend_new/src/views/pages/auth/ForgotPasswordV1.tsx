'use client'

// Next Imports
import { useState } from 'react'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// React Hook Form and Yup
import { useForm, Controller, useFormState } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import axios from 'axios'
import dotenv from 'dotenv'

// Component Imports
import { TextField } from '@mui/material'

import DirectionalIcon from '@components/DirectionalIcon'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'
import { userMethods } from '@/utils/userMethods'
import { AuthManager } from '@/utils/authManager'

const schema = yup.object().shape({
  email: yup
    .string()
    .email('El correo electrónico no tiene un formato válido')
    .required('El correo electrónico es obligatorio')
    .test('email-exists', 'El correo electrónico no existe', async value => {
      if (!value) return false

      try {
        const response = await AuthManager.validateEmail({ email: value })

        return !response.isAvailable
      } catch {
        return false
      }
    })
})

const ForgotPasswordV1 = () => {
  const [editData, setEditData] = useState<any>(null)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: ''
    }
  })

  const router = useRouter()

  const onSubmit = async (data: any) => {
    try {
      // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo

      const method = 'post' // Actualización o Creación
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password` // Creación

      const response = await axios({
        method: method, // Usa 'put' para actualización o 'post' para creación
        url: apiUrl,
        data: data
      })

      setValue('email', '')

      reset()

      router.push('/login')
    } catch (error) {
      console.error('Error al enviar los datos:', error)
    }
  }

  return (
    <AuthIllustrationWrapper>
      <Card className='flex flex-col sm:is-[450px]'>
        <CardContent className='sm:!p-12'>
          <Link href={'/'} className='flex justify-center mbe-6'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-1 mbe-6'>
            <Typography variant='h4'>Olvidé mi contraseña 🔒</Typography>
            <Typography>Ingrese su emaily siga las instrucciones para restablecer su contraseña.</Typography>
          </div>
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='email'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  value={editData ? editData.email : ''}
                  onChange={e => {
                    setEditData({ ...editData, email: e.target.value })
                    setValue('email', e.target.value)
                  }}
                  label='Email'
                  type='email'
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />

            <Button fullWidth variant='contained' type='submit'>
              Enviar enlace de activación
            </Button>
            <Typography className='flex justify-center items-center' color='primary'>
              <Link href={'/login'} className='flex items-center gap-1.5'>
                <DirectionalIcon
                  ltrIconClass='tabler-chevron-left'
                  rtlIconClass='tabler-chevron-right'
                  className='text-xl'
                />
                <span>Regresar a login</span>
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default ForgotPasswordV1
