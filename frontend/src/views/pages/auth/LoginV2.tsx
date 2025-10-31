'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// React Hook Form
import { useForm } from 'react-hook-form'

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import CheckIcon from '@mui/icons-material/Check'
import DangerousIcon from '@mui/icons-material/Dangerous'

// Classnames and Utils
import classnames from 'classnames'

import { Alert } from '@mui/material'

import { AuthManager } from '@/utils/authManager'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import type { SystemMode } from '@/@core/types'

// Styled Custom Components
const LoginIllustration = styled('img')(({ theme }) => ({
  zIndex: 2,
  blockSize: 'auto',
  maxBlockSize: 680,
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
  maxBlockSize: 355,
  inlineSize: '100%',
  position: 'absolute',
  insetBlockEnd: 0,
  zIndex: -1
})

interface FormInputs {
  username: string
  password: string
  remember: boolean
}

const LoginV2 = ({ mode }: { mode: SystemMode }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormInputs>()

  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [disabled, setDisabled] = useState(false)


  useEffect(() => { setDisabled(false) }, [])

  const router = useRouter()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))

  const authBackground = useImageVariant(mode, '/images/pages/auth-mask-light.png', '/images/pages/auth-mask-dark.png')

  const characterIllustration = useImageVariant(
    mode,
    '/images/illustrations/auth/v2-login-light.png',
    '/images/illustrations/auth/v2-login-dark.png',
    '/images/illustrations/auth/v2-login-light-border.png',
    '/images/illustrations/auth/v2-login-dark-border.png'
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
  const onSubmit = async (data: FormInputs) => {
    try {
      const result = await AuthManager.authorize(data) // Enviar username y password al backend

      if (result.status) {
        if (result.userEntity.verificationToken != '') {
            router.push('/verify-email')

            return false
        } else {

            setSuccess(true)
            setError(null)

            if (!result.userEntity.customer) {
              setSuccess(false)
              setError(null)
              router.push('/account-setup')

              return false
            }

            // Redirección por roles
            const roles = result.userEntity.roles || []
            const hasRole = (role: string) => roles.some((r: any) => r.roleEnum === role)

            if (hasRole('SUPERADMIN') || hasRole('ADMIN')) {
              router.push('/home')
            } else if (hasRole('USER') || hasRole('BIOMEDICAL') || hasRole('BIOEDICAL')) {
              router.push('/accounts/user/view')
            } else {
              router.push('/home')
            }

            return true

        }
      }
    } catch (error: any) {
      console.error('Error during login:', error.response?.data?.message || error.message)
      setError(error.response?.data?.message || 'Error de autenticación')
      setSuccess(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          { 'border-ie': settings.skin === 'bordered' }
        )}
      >
        <LoginIllustration src={characterIllustration} alt='character-illustration' />
        {!hidden && (
          <MaskImg
            alt='mask'
            src={authBackground}
            className={classnames({ 'scale-x-[-1]': theme.direction === 'rtl' })}
          />
        )}
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Bienvenido a ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography>Ingresa a tu cuenta.</Typography>
          </div>

          {success && (
            <Alert icon={<CheckIcon fontSize='inherit' />} severity='success'>
              Acceso concedido ingresando...
            </Alert>
          )}

          {error && (
            <Alert icon={<DangerousIcon fontSize='inherit' />} severity='error'>
              {error}
            </Alert>
          )}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <CustomTextField
              fullWidth
              label='Nombre de usuario'
              placeholder='Ingresa tu nombre de usuario'
              error={!!errors.username}
              helperText={errors.username?.message}
              {...register('username', { required: 'El nombre de usuario es requerido' })}
            />
            <CustomTextField
              fullWidth
              label='Contraseña'
              placeholder='············'
              type={isPasswordShown ? 'text' : 'password'}
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
              {...register('password', { required: 'La contraseña es requerida' })}
            />
            <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <FormControlLabel control={<Checkbox {...register('remember')} />} label='Recordarme' />
              <Typography className='text-end' color='primary' component={Link} href='/recover-password'>
                Olvidé mi contraseña?
              </Typography>
            </div>
            <Button fullWidth variant='contained' type='submit' disabled={disabled}>
              Acceder
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Nuevo Usuario?</Typography>
              <Typography component={Link} href='/register' color='primary'>
                Crea tu cuenta
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginV2
