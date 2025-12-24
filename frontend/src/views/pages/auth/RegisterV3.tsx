import { useState, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import axios from 'axios'
import dotenv from "dotenv";
import { MenuItem } from '@mui/material'

import CustomTextField from '@core/components/mui/TextField'
import { AuthManager } from '@/utils/authManager'
import { userMethods } from '@/utils/userMethods'

const RegisterV3 = ({ id }: { id: string }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [customersList, setCustomersList] = useState<any[]>([])
  const [roleList, setRoleList] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null) // Nuevo estado para almacenar los datos del usuario

  const router = useRouter()

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const [customersRes, rolesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/customers`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
      ])

      setCustomersList(customersRes.data)
      setRoleList(rolesRes.data)

      return true
    } catch (error) {
      console.error('Error al obtener datos:', error)

      return false
    }
  }

  // Cargar los datos del usuario si el ID existe

  useEffect(() => {
    console.log('load role admin', userMethods.isRole('SUPERADMIN'))
    alert("id" + id)
    // Cargar las opciones de clientes y roles
    fetchOptions()
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      if (id !== '') {
        try {
          const token = localStorage.getItem('AuthToken')

          if (!token) {
            throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
          }

          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          })

          if (userMethods.isRole('ADMIN')) {
            const userLogued = userMethods.getUserLogin()

            response.data.customer.id = userLogued.customer.id
            setValue('customer', userLogued.customer.id)
          } else {
            setValue('customer', response.data.customer ? response.data.customer.id : '0')
          }

          setUserData(response.data)

          setValue('role', response.data.roles ? response.data.roles[0].id : '0') // Cargar el rol
          setValue('username', response.data.username) // Cargar el nombre de usuario
          setValue('email', response.data.email) // Cargar el correo electrónico
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error)
        }
      }
    }

    console.log('load options')

    if (id && customersList.length > 0 && roleList.length > 0) {
      console.log('load user')
      fetchUserData()
    }
  }, [customersList, roleList])

  // Validación con yup
  const schema = yup.object().shape({
    customer: userMethods.isRole('ADMIN') ? yup.string().notRequired() : yup.string().required('Cliente es requerido'),
    role: yup.string().required('Rol es requerido'),
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

  // Hook form con yup
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema),
    context: { isEditing: !!id }
  })

  const onSubmit = async (data: any) => {
    try {

      const token = localStorage.getItem('AuthToken')

      if (!token) {
        throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
      }

      const userDataS = {
        id: id ? id : '0',
        customer: userMethods.isRole('ADMIN')
          ? userMethods.getUserLogin().customer.id
          : userData.customer
            ? userData.customer.id
            : data.customer,
        role: userData.roles ? userData.roles[0].id : data.role,
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      }

      console.log('to save', userDataS)

      // Si tienes un ID, significa que estás actualizando el usuario, de lo contrario, creas uno nuevo
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/users/save` // Creación

      const response = await axios({
        method: 'post', // Usa 'put' para actualización o 'post' para creación
        url: apiUrl,
        data: userDataS,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      // Procesar la respuesta
      if (response.data.result === 'success') {
        console.log('Usuario guardado con éxito:', response.data.user)
        router.push('/accounts/user/list')

        // Aquí puedes redirigir o mostrar un mensaje de éxito
      } else {
        console.error('Error en la respuesta:', response.data.message)
      }
    } catch (error) {
      console.error('Error al registrar o actualizar el usuario:', error)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <Typography variant='h4'>Datos de usuario</Typography>
          {customersList.length > 0 && roleList.length > 0 && (
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
              {/* Cliente */}

              {(userMethods.isRole('SUPERADMIN') || userMethods.isRole('MANAGER')) && (
                <Controller
                  name='customer'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      {...field}
                      select
                      fullWidth
                      value={userData?.customer ? userData.customer.id : '0'}
                      onChange={e => {
                        setUserData({ ...userData, customer: { id: e.target.value } })
                        setValue('customer', e.target.value)
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
                    value={userData?.roles ? userData.roles[0].id : '0'}
                    onChange={e => {
                      setUserData({ ...userData, roles: roleList.filter(item => item.id === e.target.value) })
                      setValue('role', e.target.value)
                    }}
                    label='Rol'
                    error={Boolean(errors.role)}
                    helperText={errors.role?.message}
                  >
                    {roleList.map((item: any) => {
                      if (
                        userMethods.isRole('SUPERADMIN') ||
                        userMethods.isRole('MANAGER') ||
                        (userMethods.isRole('ADMIN') && item.role != 'SUPERADMIN' && item.role != 'BIOMEDICAL' && item.role != 'MANAGER')
                      ) {
                        return (
                          <MenuItem key={item.id} value={item.id}>
                            {item.role}
                          </MenuItem>
                        )
                      }
                    })}
                  </CustomTextField>
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
                    disabled={id !== '' ? true : false}
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
                    disabled={id !== '' ? true : false}
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
