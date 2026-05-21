import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import { MenuItem } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'
import { AuthManager } from '@/utils/authManager'
import { userMethods } from '@/utils/userMethods'
import axiosInstance from '@/utils/axiosInstance'

const RegisterV3 = ({ id }: { id: string }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [customersList, setCustomersList] = useState<any[]>([])
  const [roleList, setRoleList] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)

  const router = useRouter()

  const fetchOptions = async () => {
    try {
      const [customersRes, rolesRes] = await Promise.all([
        axiosInstance.get('/customers'),
        axiosInstance.get('/roles')
      ])

      setCustomersList(customersRes.data || [])
      setRoleList(rolesRes.data || [])

      return true
    } catch (error) {
      console.error('Error al obtener datos:', error)

      return false
    }
  }

  useEffect(() => {
    console.log('load role admin', userMethods.isRole('MANAGER'))
    fetchOptions()
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      if (id !== '') {
        try {
          const response = await axiosInstance.get(`/users/${id}`)
          const user = response.data

          if (userMethods.isRole('ADMIN')) {
            const userLogued = userMethods.getUserLogin()
            setValue('customer', userLogued?.customer?.id || '0')
          } else {
            setValue('customer', user.customer ? user.customer.id : '0')
          }

          setUserData(user)

          setValue('role', user.roles && user.roles.length > 0 ? (user.roles[0].name || user.roles[0].role) : '')
          setValue('username', user.username || '')
          setValue('email', user.email || '')
          setValue('nombres', user.nombres || '')
          setValue('apellidos', user.apellidos || '')
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error)
        }
      }
    }

    console.log('load options')

    if (id && roleList.length > 0) {
      console.log('load user data for id:', id)
      fetchUserData()
    }
  }, [id, roleList])

  // Validación con yup
  const schema = yup.object().shape({
    customer: userMethods.isRole('ADMIN') ? yup.string().notRequired() : yup.string().required('Cliente es requerido'),
    role: yup.string().required('Rol es requerido'),
    nombres: yup.string().required('El nombre es obligatorio'),
    apellidos: yup.string().required('El apellido es obligatorio'),
    username: yup
      .string()
      .required('El nombre de usuario es obligatorio')
      .when([], {
        is: () => !id, // Solo validar si no hay un ID
        then: schema =>
          schema.test('username-exists', 'El nombre de usuario ya está en uso', async value => {
            if (!value) return false

            try {
              const response = await AuthManager.validateUsername({ username: value })

              return response.isAvailable
            } catch {
              return false
            }
          })
      }),
    email: yup
      .string()
      .email('El correo electrónico no tiene un formato válido')
      .required('El correo electrónico es obligatorio')
      .when([], {
        is: () => !id, // Solo validar si no hay un ID
        then: schema =>
          schema.test('email-exists', 'El correo electrónico ya está en uso', async value => {
            if (!value) return false

            try {
              const response = await AuthManager.validateEmail({ email: value })

              return response.isAvailable
            } catch {
              return false
            }
          })
      }),
    password: yup
      .string()
      .when([], {
        is: () => !id, // Solo requerido si no hay ID
        then: schema => schema
          .min(8, 'La contraseña debe tener al menos 8 caracteres')
          .matches(/[a-z]/, 'Debe contener al menos una letra minúscula')
          .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
          .matches(/[0-9]/, 'Debe contener al menos un número')
          .matches(/[@$!%*?&]/, 'Debe contener al menos un carácter especial')
          .required('La contraseña es obligatoria'),
        otherwise: schema => schema.notRequired()
      }),
    confirmPassword: yup
      .string()
      .when([], {
        is: () => !id,
        then: schema => schema
          .oneOf([yup.ref('password')], 'Las contraseñas deben coincidir')
          .required('La confirmación de la contraseña es obligatoria'),
        otherwise: schema => schema.notRequired()
      })
  })

  // Hook form con yup
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    context: { isEditing: !!id },
    defaultValues: {
      customer: '0',
      role: '',
      nombres: '',
      apellidos: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const onSubmit = async (data: any) => {
    try {
      const userDataS = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        username: data.username,
        email: data.email,
        password: data.password || null,
        role: data.role
      }

      console.log('to save', userDataS)

      if (id) {
        // Actualización
        await axiosInstance.put(`/users/${id}`, userDataS)
        console.log('Usuario actualizado con éxito')
      } else {
        // Creación
        await axiosInstance.post('/users', userDataS)
        console.log('Usuario creado con éxito')
      }

      router.push('/accounts/user/list')
    } catch (error) {
      console.error('Error al registrar o actualizar el usuario:', error)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <Typography variant='h4'>Datos de usuario</Typography>
          {roleList.length > 0 && (
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
              {/* Cliente */}

              {userMethods.isRole('MANAGER') && customersList.length > 0 && (
                <Controller
                  name='customer'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      fullWidth
                      value={field.value || '0'}
                      onChange={e => {
                        field.onChange(e.target.value)
                      }}
                      label='Cliente'
                      error={Boolean(errors.customer)}
                      helperText={errors.customer?.message}
                    >
                      {customersList.map(item => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}
                        </MenuItem>
                      ))}
                    </CustomTextField>
                  )}
                />
              )}

              {/* Rol */}
              <Controller
                name='role'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    select
                    fullWidth
                    value={field.value || ''}
                    onChange={e => {
                      field.onChange(e.target.value)
                    }}
                    label='Rol'
                    error={Boolean(errors.role)}
                    helperText={errors.role?.message}
                  >
                    {roleList.map((item: any) => {
                      const roleName = item.name || item.role
                      if (
                        userMethods.isRole('MANAGER') ||
                        (userMethods.isRole('ADMIN') && roleName !== 'MANAGER' && roleName !== 'BIOMEDICAL')
                      ) {
                        return (
                          <MenuItem key={roleName} value={roleName}>
                            {roleName}
                          </MenuItem>
                        )
                      }
                    })}
                  </CustomTextField>
                )}
              />

              {/* Nombres */}
              <Controller
                name='nombres'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Nombres'
                    error={Boolean(errors.nombres)}
                    helperText={errors.nombres?.message}
                  />
                )}
              />

              {/* Apellidos */}
              <Controller
                name='apellidos'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Apellidos'
                    error={Boolean(errors.apellidos)}
                    helperText={errors.apellidos?.message}
                  />
                )}
              />

              {/* Nombre de usuario */}
              <Controller
                name='username'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    disabled={id !== ''}
                    label='Nombre de usuario'
                    error={Boolean(errors.username)}
                    helperText={errors.username?.message}
                  />
                )}
              />

              {/* Correo electrónico */}
              <Controller
                name='email'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    disabled={id !== ''}
                    label='Correo electrónico'
                    type='email'
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                  />
                )}
              />

              {/* Contraseña */}
              <Controller
                name='password'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Contraseña'
                    type={isPasswordShown ? 'text' : 'password'}
                    error={Boolean(errors.password)}
                    helperText={errors.password?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton onClick={() => setIsPasswordShown(!isPasswordShown)}>
                            {isPasswordShown ? 'Ocultar' : 'Mostrar'}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              {/* Confirmar contraseña */}
              <Controller
                name='confirmPassword'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    {...field}
                    fullWidth
                    label='Confirmar contraseña'
                    type={isConfirmPasswordShown ? 'text' : 'password'}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword?.message}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}>
                            {isConfirmPasswordShown ? 'Ocultar' : 'Mostrar'}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />

              <Button fullWidth variant='contained' color='primary' type='submit' disabled={isSubmitting}>
                {id ? 'Actualizar' : 'Registrar'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterV3

