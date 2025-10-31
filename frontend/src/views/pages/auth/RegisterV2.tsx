'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'

// Next Imports
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'

import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm, Controller } from 'react-hook-form'
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'


import CustomTextField from '@core/components/mui/TextField'
import { Alert } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import DangerousIcon from '@mui/icons-material/Dangerous'

import classnames from 'classnames'

import { AuthManager } from '@/utils/authManager'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Component Imports
import Logo from '@components/layout/shared/Logo'


import { set } from 'date-fns'

// Styled Custom Components
const RegisterIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 600,
  maxInlineSize: '100%',
  margin: theme.spacing(12),
  [theme.breakpoints.down(1536)]: {
    maxBlockSize: 550
  },
  [theme.breakpoints.down('lg')]: {
    maxBlockSize: 450
  }
}))

const MaskImg = styled('img')({
  blockSize: 'auto',
  maxBlockSize: 345,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

const RegisterV2 = ({ mode }: { mode: any }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [disabled, setDisabled] = useState(true)


  useEffect(() => {

    setDisabled(false)

  } , [])

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks

  const { settings } = useSettings()
  const router = useRouter()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const handleClickShowConfirmPassword = () => setIsConfirmPasswordShown(show => !show)

  // Validaciones con yup
  const schema = yup.object().shape({
    nombres: yup.string().required('El nombre es obligatorio'),
    apellidos: yup.string().required('El apellido es obligatorio'),
    username: yup
      .string()
      .required('El nombre de usuario es obligatorio')
      .test('username-exists', 'El nombre de usuario ya está en uso', async value => {
        if (!value) return false

        try {
          const response = await AuthManager.validateUsername({ username: value })

          return response.isAvailable
        } catch {
          return false
        }
      }),
    email: yup
      .string()
      .email('El correo electrónico no tiene un formato válido')
      .required('El correo electrónico es obligatorio')
      .test('email-exists', 'El correo electrónico ya está en uso', async value => {
        if (!value) return false

        try {
          const response = await AuthManager.validateEmail({ email: value })

          return response.isAvailable
        } catch {
          return false
        }
      }),
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
    formState: { errors },
    trigger // Importante para activar validación en eventos específicos
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onBlur' // O usa 'onChange' si prefieres validar mientras escribe
  })

  // Manejo del envío del formulario
  const onSubmit = async (data: { username: string; password: string; email: string; confirmPassword: string }) => {
    try {
      // Add the default role to the data
      const roleData = {
        ...data,
        roleRequest: {
          roleListName: ['ADMIN'] // Set the default role to 'ADMIN'
        }
      }

      //console.log('Data to send:', roleData)
      const response = await AuthManager.register(roleData)

      console.log('Registro exitoso:', response)

      setSuccess(true)
      setError(null)
      setDisabled(false)

      router.push('/verify-email') // Redirigir al usuario al home después de login exitoso


    } catch (error:any) {

      console.error('Error al registrar:', error)
      setError(error.message)
      setSuccess(false)

      setDisabled(false)

    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <RegisterIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && (
          <MaskImg
            alt='mask'
            src={authBackground}
            className={classnames({ 'scale-x-[-1]': theme.direction === 'rtl' })}
          />
        )}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link href='/' className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>¡La aventura comienza aquí 🚀</Typography>
            <Typography>¡Haz que la gestión de tu aplicación sea fácil y divertida!</Typography>
          </div>

          {success && (
            <Alert icon={<CheckIcon fontSize='inherit' />} severity='success'>
              Bienvenido te haz registrado exitosamente!
            </Alert>
          )}

          {error && (
            <Alert icon={<DangerousIcon fontSize='inherit' />} severity='error'>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete='off' className='flex flex-col gap-6'>
            <CustomTextField
              autoFocus
              fullWidth
              label='Nombre completo'
              placeholder='Ingresa tu nombre completo'
              {...register('nombres')}
              error={!!errors.nombres}
              helperText={errors.nombres?.message}
            />
            <CustomTextField
              autoFocus
              fullWidth
              label='Apellidos'
              placeholder='Ingresa tus apellidos'
              {...register('apellidos')}
              error={!!errors.apellidos}
              helperText={errors.apellidos?.message}
            />

            <CustomTextField
              autoFocus
              fullWidth
              label='Nombre de usuario'
              placeholder='Ingresa tu nombre de usuario'
              {...register('username', {
                onBlur: () => trigger('username') // Valida cuando el usuario abandona el campo
              })}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <CustomTextField
              fullWidth
              label='Correo electrónico'
              placeholder='Ingresa tu correo electrónico'
              {...register('email', {
                onBlur: () => trigger('email') // Valida cuando el usuario abandona el campo
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <CustomTextField
              fullWidth
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
            <FormControlLabel
              control={<Checkbox />}
              label={
                <>
                  <span>Acepto </span>
                  <Link className='text-primary' href='/' onClick={e => e.preventDefault()}>
                    la política de privacidad y los términos
                  </Link>
                </>
              }
            />
            <Button disabled={disabled} fullWidth variant='contained' type='submit'>
              Registrarse
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>¿Ya tienes una cuenta?</Typography>
              <Typography component={Link} href='/login' color='primary'>
                Inicia sesión en su lugar
              </Typography>
            </div>
            <Divider className='gap-2 text-textPrimary'>o</Divider>
            <div className='flex justify-center items-center gap-1.5'>
              <IconButton className='text-facebook' size='small'>
                <i className='tabler-brand-facebook' />
              </IconButton>
              <IconButton className='text-google' size='small'>
                <i className='tabler-brand-google' />
              </IconButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterV2
