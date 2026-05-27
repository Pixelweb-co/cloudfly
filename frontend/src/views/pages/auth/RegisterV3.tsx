import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import axios from 'axios'

import CustomTextField from '@core/components/mui/TextField'
import { AuthManager } from '@/utils/authManager'
import { userMethods } from '@/utils/userMethods'
import AvatarUploadDialog from '@/components/dialogs/AvatarUploadDialog'

const RegisterV3 = ({ id }: { id: string }) => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)
  const [roleList, setRoleList] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)
  
  // Avatar states
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarId, setAvatarId] = useState<number | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const router = useRouter()

  const fetchOptions = async () => {
    try {
      const token = localStorage.getItem('AuthToken')
      if (!token) throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')

      const rolesRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })
      setRoleList(rolesRes.data)
      return true
    } catch (error) {
      console.error('Error al obtener datos:', error)
      return false
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      if (id && id !== '') {
        try {
          const token = localStorage.getItem('AuthToken')
          if (!token) throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')

          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          })

          const data = response.data
          setUserData(data)

          setValue('nombres', data.nombres || '')
          setValue('apellidos', data.apellidos || '')
          setValue('role', data.roles && data.roles.length > 0 ? data.roles[0].id : '')
          setValue('username', data.username)
          setValue('email', data.email)
          
          if (data.avatarId) setAvatarId(data.avatarId)
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl)

        } catch (error) {
          console.error('Error al cargar datos del usuario:', error)
        }
      }
    }

    if (id && roleList.length > 0) {
      fetchUserData()
    }
  }, [roleList])

  const schema = yup.object().shape({
    nombres: yup.string().required('Los nombres son requeridos'),
    apellidos: yup.string().required('Los apellidos son requeridos'),
    role: yup.string().required('Rol es requerido'),
    username: yup.string().required('El nombre de usuario es obligatorio')
      .when([], {
        is: () => !id,
        then: schema => schema.test('username-exists', 'El nombre de usuario ya está en uso', async value => {
          if (!value) return false
          try {
            const response = await AuthManager.validateUsername({ username: value })
            return response.isAvailable
          } catch {
            return false
          }
        })
      }),
    email: yup.string().email('El correo electrónico no tiene un formato válido').required('El correo electrónico es obligatorio')
      .when([], {
        is: () => !id,
        then: schema => schema.test('email-exists', 'El correo electrónico ya está en uso', async value => {
          if (!value) return false
          try {
            const response = await AuthManager.validateEmail({ email: value })
            return response.isAvailable
          } catch {
            return false
          }
        })
      }),
    password: yup.string()
      .when([], {
        is: () => !id,
        then: schema => schema.required('La contraseña es obligatoria').min(8, 'La contraseña debe tener al menos 8 caracteres').matches(/[a-z]/, 'Debe contener al menos una letra minúscula').matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula').matches(/[0-9]/, 'Debe contener al menos un número').matches(/[@$!%*?&]/, 'Debe contener al menos un carácter especial'),
        otherwise: schema => schema.notRequired()
      }),
    confirmPassword: yup.string()
      .when('password', {
        is: (val: string) => val && val.length > 0,
        then: schema => schema.required('La confirmación de la contraseña es obligatoria').oneOf([yup.ref('password')], 'Las contraseñas deben coincidir'),
        otherwise: schema => schema.notRequired()
      })
  })

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    context: { isEditing: !!id }
  })

  const onSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('AuthToken')
      if (!token) throw new Error('Token no disponible.')

      const loggedUser = userMethods.getUserLogin()
      let tenantIdToUse = '1'
      
      if (typeof window !== 'undefined') {
        const storedTenant = localStorage.getItem('tenantId')
        if (storedTenant) tenantIdToUse = storedTenant
        else if (loggedUser?.customer?.id) tenantIdToUse = loggedUser.customer.id
      }

      const userDataS = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        role: userData?.roles ? userData.roles[0].name : roleList.find(r => r.id === data.role)?.name || 'USER',
        username: data.username,
        email: data.email,
        password: data.password,
        avatarId: avatarId
      }

      const apiUrl = id ? `${process.env.NEXT_PUBLIC_API_URL}/users/${id}` : `${process.env.NEXT_PUBLIC_API_URL}/users`

      const response = await axios({
        method: id ? 'put' : 'post',
        url: apiUrl,
        data: userDataS,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-tenant-id': tenantIdToUse
        }
      })

      if (response.status === 201 || response.status === 200) {
        console.log('Usuario guardado con éxito:', response.data)
        router.push('/accounts/user/list')
      } else {
        console.error('Error en la respuesta:', response.data)
      }
    } catch (error) {
      console.error('Error al registrar o actualizar el usuario:', error)
    }
  }

  const handleAvatarUpload = (id: number, url: string) => {
    setAvatarId(id)
    setAvatarUrl(url)
  }

  return (
    <div className='flex bs-full w-full justify-center'>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper w-full p-6 md:p-12'>
        <div className='flex flex-col gap-6 w-full mbs-11 sm:mbs-14 md:mbs-0'>
          <Typography variant='h4'>Datos de usuario</Typography>
          
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative">
              <Avatar src={avatarUrl || ''} sx={{ width: 120, height: 120 }} />
              <IconButton 
                color="primary" 
                className="absolute bottom-0 right-0 bg-white shadow-md" 
                onClick={() => setAvatarDialogOpen(true)}
              >
                <i className="tabler-camera" />
              </IconButton>
            </div>
          </div>

          {roleList.length > 0 && (
            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6 w-full'>
              <Grid container spacing={6}>
                
                <Grid item xs={12} sm={6}>
                  <Controller
                    name='nombres'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label='Nombres'
                        error={Boolean(errors.nombres)}
                        helperText={errors.nombres?.message as string}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name='apellidos'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label='Apellidos'
                        error={Boolean(errors.apellidos)}
                        helperText={errors.apellidos?.message as string}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name='role'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        select
                        fullWidth
                        value={userData?.roles ? userData.roles[0].id : field.value || ''}
                        onChange={e => {
                          setUserData({ ...userData, roles: roleList.filter(item => item.id === e.target.value) })
                          setValue('role', e.target.value)
                        }}
                        label='Rol'
                        error={Boolean(errors.role)}
                        helperText={errors.role?.message as string}
                      >
                        {roleList.map((item: any) => {
                          if (userMethods.isRole('SUPERADMIN') || userMethods.isRole('MANAGER') || (userMethods.isRole('ADMIN') && item.role != 'SUPERADMIN' && item.role != 'BIOMEDICAL' && item.role != 'MANAGER')) {
                            return <MenuItem key={item.id} value={item.id}>{item.role}</MenuItem>
                          }
                          return null;
                        })}
                      </CustomTextField>
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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
                        helperText={errors.username?.message as string}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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
                        helperText={errors.email?.message as string}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}></Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name='password'
                    control={control}
                    render={({ field }) => (
                      <CustomTextField
                        {...field}
                        fullWidth
                        label={id ? 'Nueva contraseña (Opcional)' : 'Contraseña'}
                        type={isPasswordShown ? 'text' : 'password'}
                        error={Boolean(errors.password)}
                        helperText={errors.password?.message as string}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton onClick={() => setIsPasswordShown(!isPasswordShown)}>
                                <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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
                        helperText={errors.confirmPassword?.message as string}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}>
                                <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Grid item xs={12} className="mt-4">
                <Button variant='contained' color='primary' type='submit' disabled={isSubmitting}>
                  {id ? 'Actualizar' : 'Registrar'}
                </Button>
              </Grid>
            </form>
          )}
        </div>
      </div>
      
      <AvatarUploadDialog 
        open={avatarDialogOpen} 
        onClose={() => setAvatarDialogOpen(false)} 
        onUpload={handleAvatarUpload} 
      />
    </div>
  )
}

export default RegisterV3
