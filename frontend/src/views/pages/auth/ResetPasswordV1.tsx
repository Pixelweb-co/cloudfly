'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import { useParams } from 'next/navigation'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'

// Type Imports

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

import DirectionalIcon from '@components/DirectionalIcon'

// Component Imports

import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Styled Component Imports
import AuthIllustrationWrapper from './AuthIllustrationWrapper'
import { AuthManager } from '@/utils/authManager'

const ResetPasswordV1 = () => {
  // States
  const params = useParams()
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [submited, setSubmited] = useState(false)

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  // Validaciones con yup
  const schema = yup.object().shape({
    password: yup
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .matches(/[a-z]/, 'Debe contener al menos una letra minúscula')
      .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
      .matches(/[0-9]/, 'Debe contener al menos un número')
      .matches(/[@$!%*?&]/, 'Debe contener al menos un carácter especial')
      .required('La contraseña es obligatoria'),
    confirmPassword: yup
      .string()
      .oneOf([yup.ref('password')], 'Las contraseñas deben coincidir')
      .required('La confirmación de la contraseña es obligatoria')
  })

  // Formulario con React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors } // Importante para activar validación en eventos específicos
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onBlur' // O usa 'onChange' si prefieres validar mientras escribe
  })

  // Manejo del envío del formulario
  const onSubmit = async (data: { password: string }) => {
    try {
      console.log('Data to send:', data)

      if (params?.id) {
        console.log('Token almacenado:', params.id) // Para verificar en consola

        await AuthManager.resetPassword({ newPassword: data.password, token: params.id })
        setSubmited(true)
      } else {
        console.log('token invalido')
      }
    } catch (error) {
      console.error('Error al registrar:', error)
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
            <Typography variant='h4'>Restablecer contraseña 🔒</Typography>
            {!submited && <Typography>La contraseña debe ser diferente a la anterior</Typography>}
          </div>

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            {!submited && (
              <>
                <CustomTextField
                  fullWidth
                  autoFocus
                  label='Contraseña'
                  placeholder='············'
                  type={isPasswordShown ? 'text' : 'password'}
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <CustomTextField
                  fullWidth
                  label='Confirmar Contraseña'
                  placeholder='············'
                  type={isConfirmPasswordShown ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton
                          edge='end'
                          onClick={handleClickShowConfirmPassword}
                          onMouseDown={e => e.preventDefault()}
                        >
                          <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                <Button fullWidth variant='contained' type='submit'>
                  Cambiar contraseña
                </Button>
              </>
            )}
            {submited && <Typography>Se ha restablecido la contraseña. Ya puedes iniciar sesión.</Typography>}

            <Typography className='flex justify-center items-center' color='primary'>
              <Link href={'/login'} className='flex items-center gap-1.5'>
                <DirectionalIcon
                  ltrIconClass='tabler-chevron-left'
                  rtlIconClass='tabler-chevron-right'
                  className='text-xl'
                />
                <span>Volver a login</span>
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </AuthIllustrationWrapper>
  )
}

export default ResetPasswordV1
