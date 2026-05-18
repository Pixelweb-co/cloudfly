'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import EditUserInfo from '@components/dialogs/edit-user-info'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import CustomAvatar from '@core/components/mui/Avatar'

// Utils
import { userMethods } from '@/utils/userMethods'

import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'

const UserDetails = () => {
  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser

  const [tenantData, setTenantData] = useState<any>(null)

  useEffect(() => {
    if (sessionUser?.customerId) {
      axios.get(`${API_URL}/customers/${sessionUser.customerId}`)
        .then(res => {
          setTenantData(res.data)
        })
        .catch(err => console.error("Error fetching tenant info", err))
    }
  }, [sessionUser?.customerId])

  const firstName = sessionUser?.nombres || sessionUser?.firstName || sessionUser?.name?.split(' ')[0] || ''
  const lastName = sessionUser?.apellidos || sessionUser?.lastName || sessionUser?.name?.split(' ').slice(1).join(' ') || ''
  const userName = sessionUser?.username || sessionUser?.email || sessionUser?.user_name || '-'
  const billingEmail = tenantData?.email || sessionUser?.email || ''
  const status = sessionUser?.enabled ? 'Activo' : 'Inactivo'
  const role = sessionUser?.roles?.[0]?.name || sessionUser?.roles?.[0]?.role || 'USER'
  const taxId = tenantData?.nit || sessionUser?.taxId || sessionUser?.nit || '-'
  const contact = tenantData?.phone || sessionUser?.phone || sessionUser?.cellphone || sessionUser?.telefono || '-'
  const language = [sessionUser?.language || 'Español']
  const country = tenantData?.country || sessionUser?.country || 'Colombia'

  // Vars
  const buttonProps = (children: string, color: ThemeColor, variant: ButtonProps['variant']): ButtonProps => ({
    children,
    color,
    variant
  })

  const userData = {
    firstName,
    lastName,
    userName,
    billingEmail,
    status,
    role,
    taxId,
    contact,
    language,
    country,
    useAsBillingAddress: true
  }

  return (
    <>
      <Card>
        <CardContent className='flex flex-col pbs-12 gap-6'>
          <div className='flex flex-col gap-6'>
            <div className='flex items-center justify-center flex-col gap-4'>
              <div className='flex flex-col items-center gap-4'>
                <CustomAvatar alt='user-profile' src='/images/avatars/1.png' variant='rounded' size={120} />
                <Typography variant='h5'>{`${firstName} ${lastName}`.trim() || 'Usuario'}</Typography>
              </div>
              <Chip label={role} color='secondary' size='small' variant='tonal' />
            </div>
          </div>
          <div>
            <Typography variant='h5'>Detalles del Perfil</Typography>
            <Divider className='mlb-4' />
            <div className='flex flex-col gap-2'>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Usuario:
                </Typography>
                <Typography>{userName || '-'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Email de Facturación:
                </Typography>
                <Typography>{billingEmail || '-'}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Estado:
                </Typography>
                <Typography color='text.primary'>{status}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Rol:
                </Typography>
                <Typography color='text.primary'>{role}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  NIT/RUT:
                </Typography>
                <Typography color='text.primary'>{taxId}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Contacto:
                </Typography>
                <Typography color='text.primary'>{contact}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  Idioma:
                </Typography>
                <Typography color='text.primary'>{language.join(', ')}</Typography>
              </div>
              <div className='flex items-center flex-wrap gap-x-1.5'>
                <Typography className='font-medium' color='text.primary'>
                  País:
                </Typography>
                <Typography color='text.primary'>{country}</Typography>
              </div>
            </div>
          </div>
          <div className='flex gap-4 justify-center'>
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Editar', 'primary', 'contained')}
              dialog={EditUserInfo}
              dialogProps={{ data: userData }}
            />
            <OpenDialogOnElementClick
              element={Button}
              elementProps={buttonProps('Suspender', 'error', 'tonal')}
              dialog={ConfirmationDialog}
              dialogProps={{ type: 'suspend-account' }}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default UserDetails
