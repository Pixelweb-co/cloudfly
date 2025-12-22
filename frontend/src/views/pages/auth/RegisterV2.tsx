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

  }, [])

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


    } catch (error: any) {

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
          'flex bs-full flex-1 min-bs-[100dvh] relative max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <div className='m-auto w-full max-w-4xl ps-10 pe-6 flex flex-col gap-8'>
          {/* Hero Section con Urgencia */}
          <div className='text-left'>
            <div className='inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full mb-4'>
              <i className='tabler-sparkles text-xl' />
              <Typography variant='body2' className='font-semibold'>
                🎁 14 días GRATIS • Sin tarjeta de crédito
              </Typography>
            </div>

            <Typography variant='h2' component='h1' className='mb-3 font-bold leading-tight'>
              Automatiza tu negocio con <span className='text-primary'>IA en minutos</span>
            </Typography>

            <Typography variant='h6' className='text-textSecondary font-normal mb-6'>
              Más de <strong className='text-primary'>10,000 empresas</strong> ya confían en CloudFly para
              impulsar sus ventas con chatbots inteligentes, gestión automatizada y análisis en tiempo real.
            </Typography>
          </div>

          {/* Beneficios Clave con Iconos */}
          <div className='grid gap-6 lg:grid-cols-2'>
            {/* Beneficio 1 */}
            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center'>
                <i className='tabler-rocket text-2xl text-primary' />
              </div>
              <div>
                <Typography variant='h6' className='mb-1 font-semibold'>
                  Lanzamiento en 5 minutos
                </Typography>
                <Typography variant='body2' className='text-textSecondary'>
                  No necesitas ser experto. Nuestros asistentes IA configuran todo por ti automáticamente.
                </Typography>
              </div>
            </div>

            {/* Beneficio 2 */}
            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center'>
                <i className='tabler-chart-line text-2xl text-success' />
              </div>
              <div>
                <Typography variant='h6' className='mb-1 font-semibold'>
                  +300% más conversiones
                </Typography>
                <Typography variant='body2' className='text-textSecondary'>
                  Responde a tus clientes 24/7, captura leads mientras duermes y nunca pierdas una venta.
                </Typography>
              </div>
            </div>

            {/* Beneficio 3 */}
            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center'>
                <i className='tabler-clock text-2xl text-warning' />
              </div>
              <div>
                <Typography variant='h6' className='mb-1 font-semibold'>
                  Ahorra 20 horas semanales
                </Typography>
                <Typography variant='body2' className='text-textSecondary'>
                  Automatiza respuestas, seguimientos y reportes. Enfócate en hacer crecer tu negocio.
                </Typography>
              </div>
            </div>

            {/* Beneficio 4 */}
            <div className='flex gap-4'>
              <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center'>
                <i className='tabler-shield-check text-2xl text-info' />
              </div>
              <div>
                <Typography variant='h6' className='mb-1 font-semibold'>
                  Datos 100% seguros
                </Typography>
                <Typography variant='body2' className='text-textSecondary'>
                  Encriptación de nivel bancario. Tus datos y los de tus clientes están protegidos.
                </Typography>
              </div>
            </div>
          </div>

          {/* Prueba Social */}
          <div className='bg-backgroundPaper rounded-2xl p-6 border border-divider'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='flex -space-x-2'>
                <div className='w-10 h-10 rounded-full bg-primary/20 border-2 border-backgroundPaper flex items-center justify-center'>
                  <i className='tabler-user text-primary' />
                </div>
                <div className='w-10 h-10 rounded-full bg-success/20 border-2 border-backgroundPaper flex items-center justify-center'>
                  <i className='tabler-user text-success' />
                </div>
                <div className='w-10 h-10 rounded-full bg-warning/20 border-2 border-backgroundPaper flex items-center justify-center'>
                  <i className='tabler-user text-warning' />
                </div>
                <div className='w-10 h-10 rounded-full bg-info/20 border-2 border-backgroundPaper flex items-center justify-center text-sm font-semibold'>
                  +10K
                </div>
              </div>
              <div className='flex gap-1'>
                {[...Array(5)].map((_, i) => (
                  <i key={i} className='tabler-star-filled text-warning text-lg' />
                ))}
              </div>
            </div>
            <Typography variant='body2' className='text-textSecondary italic'>
              "Increíble. En 2 meses duplicamos nuestras ventas online. El chatbot responde mejor
              que nuestro equipo humano y está disponible 24/7. Mejor inversión del año."
            </Typography>
            <Typography variant='caption' className='text-textSecondary mt-2 block'>
              — María González, CEO de TechStore Colombia
            </Typography>
          </div>

          {/* Carrusel de Empresas */}
          <div className='bg-backgroundPaper rounded-2xl p-6 border border-divider'>
            <Typography variant='body2' className='text-textSecondary text-center mb-4 font-medium'>
              Empresas que confían en CloudFly
            </Typography>
            <div className='flex gap-6 items-center justify-center flex-wrap'>
              {/* Retail */}
              <div className='w-20 h-20 rounded-xl bg-[#2D3748] flex items-center justify-center hover:bg-[#1a202c] transition-colors'>
                <i className='tabler-shopping-cart text-4xl text-gray-400' />
              </div>

              {/* Food & Delivery */}
              <div className='w-20 h-20 rounded-xl bg-[#2D3748] flex items-center justify-center hover:bg-[#1a202c] transition-colors'>
                <i className='tabler-bike text-4xl text-gray-400' />
              </div>

              {/* Banking */}
              <div className='w-20 h-20 rounded-xl bg-[#2D3748] flex items-center justify-center hover:bg-[#1a202c] transition-colors'>
                <i className='tabler-building-bank text-4xl text-gray-400' />
              </div>

              {/* Tech */}
              <div className='w-20 h-20 rounded-xl bg-[#2D3748] flex items-center justify-center hover:bg-[#1a202c] transition-colors'>
                <i className='tabler-code text-4xl text-gray-400' />
              </div>

              {/* eCommerce */}
              <div className='w-20 h-20 rounded-xl bg-[#2D3748] flex items-center justify-center hover:bg-[#1a202c] transition-colors'>
                <i className='tabler-package text-4xl text-gray-400' />
              </div>
            </div>
          </div>

          {/* CTA con Escasez */}
          <div className='bg-gradient-to-r from-primary/10 to-success/10 rounded-2xl p-6 text-center'>
            <Typography variant='h6' className='mb-2 font-semibold'>
              ⏰ Prueba <span className='text-primary'>14 días gratis</span> todas las funciones
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              Sin compromiso. Cancela cuando quieras. Configuración personalizada incluida (valor $500 USD)
            </Typography>
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
        <Link href='/' className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>

        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          {/* Header mejorado */}
          <div className='flex flex-col gap-2 text-center'>
            <div className='inline-flex items-center justify-center w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20'>
              <i className='tabler-rocket text-4xl text-primary' />
            </div>
            <Typography variant='h4' className='font-bold'>
              ¡Prueba Gratis 14 Días! 🚀
            </Typography>
            <Typography variant='body2' className='text-textSecondary'>
              Crea tu cuenta en 30 segundos. Sin tarjeta, cancela cuando quieras.
            </Typography>
          </div>

          {success && (
            <Alert
              icon={<CheckIcon fontSize='inherit' />}
              severity='success'
              className='rounded-xl'
            >
              ¡Bienvenido! Te has registrado exitosamente. Revisa tu correo para activar tu cuenta.
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

          <form onSubmit={handleSubmit(onSubmit)} noValidate autoComplete='off' className='flex flex-col gap-5'>
            {/* Nombres y Apellidos en grid */}
            <div className='grid grid-cols-2 gap-4'>
              <CustomTextField
                fullWidth
                label='Nombre'
                placeholder='Juan'
                {...register('nombres')}
                error={!!errors.nombres}
                helperText={errors.nombres?.message}
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
                label='Apellido'
                placeholder='Pérez'
                {...register('apellidos')}
                error={!!errors.apellidos}
                helperText={errors.apellidos?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='tabler-user text-textSecondary' />
                    </InputAdornment>
                  )
                }}
              />
            </div>

            <CustomTextField
              fullWidth
              label='Nombre de usuario'
              placeholder='juanperez123'
              {...register('username', {
                onBlur: () => trigger('username')
              })}
              error={!!errors.username}
              helperText={errors.username?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-at text-textSecondary' />
                  </InputAdornment>
                )
              }}
            />

            <CustomTextField
              fullWidth
              label='Correo electrónico'
              placeholder='tu@email.com'
              {...register('email', {
                onBlur: () => trigger('email')
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-mail text-textSecondary' />
                  </InputAdornment>
                )
              }}
            />

            <CustomTextField
              fullWidth
              label='Contraseña'
              placeholder='Mínimo 8 caracteres'
              type={isPasswordShown ? 'text' : 'password'}
              {...register('password')}
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
            />

            <CustomTextField
              fullWidth
              label='Confirmar Contraseña'
              placeholder='Repite tu contraseña'
              type={isConfirmPasswordShown ? 'text' : 'password'}
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-lock text-textSecondary' />
                  </InputAdornment>
                ),
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
              control={<Checkbox defaultChecked />}
              label={
                <>
                  <span className='text-sm'>Acepto </span>
                  <Link className='text-primary text-sm font-medium' href='/' onClick={e => e.preventDefault()}>
                    la política de privacidad y los términos
                  </Link>
                </>
              }
            />

            <Button
              disabled={disabled}
              fullWidth
              variant='contained'
              type='submit'
              size='large'
              className='py-3 font-semibold text-base rounded-lg shadow-lg hover:shadow-xl transition-all'
            >
              {disabled ? (
                <>
                  <i className='tabler-loader-2 animate-spin mr-2' />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <i className='tabler-rocket mr-2' />
                  Iniciar prueba gratis de 14 días
                </>
              )}
            </Button>

            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography variant='body2' className='text-textSecondary'>
                ¿Ya tienes una cuenta?
              </Typography>
              <Typography
                component={Link}
                href='/login'
                className='text-primary font-semibold hover:underline'
              >
                Iniciar sesión
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
                startIcon={<i className='tabler-brand-facebook' />}
              >
                Facebook
              </Button>
              <Button
                variant='outlined'
                className='flex-1 py-2.5 rounded-lg hover:bg-backgroundPaper/50'
                startIcon={<i className='tabler-brand-google' />}
              >
                Google
              </Button>
            </div>

            {/* Seguridad footer */}
            <div className='mt-2 p-4 bg-success/5 rounded-xl border border-success/20'>
              <div className='flex items-center gap-2'>
                <i className='tabler-shield-check text-success text-xl' />
                <Typography variant='caption' className='text-textSecondary'>
                  <strong>100% Seguro.</strong> Encriptación SSL. Nunca compartimos tu información.
                </Typography>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterV2
