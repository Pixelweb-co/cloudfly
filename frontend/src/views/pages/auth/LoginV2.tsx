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

          if (hasRole('SUPERADMIN') || hasRole('ADMIN') || hasRole('MANAGER')) {
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
          'flex bs-full flex-1 min-bs-[100dvh] relative max-md:hidden',
          { 'border-ie': settings.skin === 'bordered' }
        )}
      >
        <div className='m-auto w-full max-w-4xl ps-10 pe-6 flex flex-col gap-8'>
          {/* Hero Section */}
          <div className='text-left'>
            <div className='inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4'>
              <i className='tabler-trending-up text-xl' />
              <Typography variant='body2' className='font-semibold'>
                💼 Accede a tu panel de control
              </Typography>
            </div>

            <Typography variant='h2' component='h1' className='mb-3 font-bold leading-tight'>
              Bienvenido de vuelta a <span className='text-primary'>CloudFly</span>
            </Typography>

            <Typography variant='h6' className='text-textSecondary font-normal mb-6'>
              Gestiona tu negocio con IA, automatiza procesos y toma decisiones basadas en datos en tiempo real.
            </Typography>
          </div>

          {/* Stats Grid */}
          <div className='grid gap-6 lg:grid-cols-3'>
            <div className='bg-backgroundPaper rounded-2xl p-6 border border-divider'>
              <div className='flex items-center gap-4 mb-3'>
                <div className='w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center'>
                  <i className='tabler-robot text-2xl text-success' />
                </div>
                <div>
                  <Typography variant='h4' className='font-bold'>24/7</Typography>
                  <Typography variant='caption' className='text-textSecondary'>Atención automatizada</Typography>
                </div>
              </div>
            </div>

            <div className='bg-backgroundPaper rounded-2xl p-6 border border-divider'>
              <div className='flex items-center gap-4 mb-3'>
                <div className='w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center'>
                  <i className='tabler-chart-line text-2xl text-warning' />
                </div>
                <div>
                  <Typography variant='h4' className='font-bold'>+300%</Typography>
                  <Typography variant='caption' className='text-textSecondary'>Más conversiones</Typography>
                </div>
              </div>
            </div>

            <div className='bg-backgroundPaper rounded-2xl p-6 border border-divider'>
              <div className='flex items-center gap-4 mb-3'>
                <div className='w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center'>
                  <i className='tabler-users text-2xl text-info' />
                </div>
                <div>
                  <Typography variant='h4' className='font-bold'>10K+</Typography>
                  <Typography variant='caption' className='text-textSecondary'>Empresas activas</Typography>
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className='bg-backgroundPaper rounded-2xl p-6 border border-divider'>
            <Typography variant='h6' className='mb-4 font-semibold'>
              ✨ Lo que puedes hacer hoy:
            </Typography>
            <div className='grid gap-3'>
              <div className='flex items-center gap-3'>
                <i className='tabler-check text-success text-xl' />
                <Typography variant='body2' className='text-textSecondary'>
                  Ver tus métricas de ventas y conversión en tiempo real
                </Typography>
              </div>
              <div className='flex items-center gap-3'>
                <i className='tabler-check text-success text-xl' />
                <Typography variant='body2' className='text-textSecondary'>
                  Configurar tu chatbot IA en 5 minutos
                </Typography>
              </div>
              <div className='flex items-center gap-3'>
                <i className='tabler-check text-success text-xl' />
                <Typography variant='body2' className='text-textSecondary'>
                  Automatizar respuestas y seguimiento de clientes
                </Typography>
              </div>
            </div>
          </div>
        </div>

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
          {/* Header mejorado */}
          <div className='flex flex-col gap-2 text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-primary/20 to-info/20'>
              <i className='tabler-login text-4xl text-primary' />
            </div>
            <Typography variant='h4' className='font-bold'>
              ¡Bienvenido de vuelta! 👋
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              Ingresa a tu cuenta y continúa automatizando tu negocio
            </Typography>
          </div>

          {success && (
            <Alert
              icon={<CheckIcon fontSize='inherit' />}
              severity='success'
              className='rounded-xl'
            >
              ✅ Acceso concedido. Redirigiendo...
            </Alert>
          )}

          {error && (
            <Alert
              icon={<DangerousIcon fontSize='inherit' />}
              severity='error'
              className='rounded-xl'
            >
              {error}
            </Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
            <CustomTextField
              fullWidth
              label='Nombre de usuario'
              placeholder='juanperez123'
              error={!!errors.username}
              helperText={errors.username?.message}
              {...register('username', { required: 'El nombre de usuario es requerido' })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-user text-textSecondary' />
                  </InputAdornment>
                )
              }}
            />

            <CustomTextField
              fullWidth
              label='Contraseña'
              placeholder='Ingresa tu contraseña'
              type={isPasswordShown ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-lock text-textSecondary' />
                  </InputAdornment>
                ),
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
              <FormControlLabel
                control={<Checkbox {...register('remember')} defaultChecked />}
                label={<Typography variant='body2'>Recordarme</Typography>}
              />
              <Typography
                variant='body2'
                className='text-primary font-semibold hover:underline'
                component={Link}
                href='/recover-password'
              >
                ¿Olvidaste tu contraseña?
              </Typography>
            </div>

            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={disabled}
              size='large'
              className='py-3 font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all'
            >
              {disabled ? (
                <>
                  <i className='tabler-loader-2 animate-spin mr-2' />
                  Ingresando...
                </>
              ) : (
                <>
                  <i className='tabler-login mr-2' />
                  Iniciar sesión
                </>
              )}
            </Button>

            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography variant='body2' className='text-textSecondary'>
                ¿Nuevo en {themeConfig.templateName}?
              </Typography>
              <Typography
                component={Link}
                href='/register'
                className='text-primary font-semibold hover:underline'
              >
                Prueba 14 días gratis
              </Typography>
            </div>

            <Divider className='gap-2 text-textPrimary'>
              <Typography variant='caption' className='text-textSecondary'>
                O continúa con
              </Typography>
            </Divider>

            <div className='flex justify-center items-center gap-3'>
              <Button
                variant='outlined'
                className='flex-1 py-2.5 rounded-lg hover:bg-backgroundPaper/50'
                startIcon={<i className='tabler-brand-google' />}
              >
                Google
              </Button>
              <Button
                variant='outlined'
                className='flex-1 py-2.5 rounded-lg hover:bg-backgroundPaper/50'
                startIcon={<i className='tabler-brand-microsoft' />}
              >
                Microsoft
              </Button>
            </div>

            {/* Seguridad footer */}
            <div className='mt-2 p-4 bg-info/5 rounded-xl border border-info/20'>
              <div className='flex items-center gap-2'>
                <i className='tabler-shield-lock text-info text-xl' />
                <Typography variant='caption' className='text-textSecondary'>
                  <strong>Conexión segura.</strong> Tus datos están protegidos con encriptación SSL.
                </Typography>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginV2
