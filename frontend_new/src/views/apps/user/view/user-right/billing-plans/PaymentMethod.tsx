'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import BillingCard from '@components/dialogs/billing-card'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

// Utils
import { userMethods } from '@/utils/userMethods'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cloudfly.com.co'

type DataType = {
  name: string
  imgSrc: string
  imgAlt: string
  cardCvv: string
  expiryDate: string
  cardNumber: string
  cardStatus?: string
  badgeColor?: ThemeColor
}

const PaymentMethod = () => {
  // States
  const [data, setData] = useState<DataType[]>([])
  const [creditCard, setCreditCard] = useState(0)

  // Read session user safely on client
  const fullUser: any = userMethods.getUserLogin?.() || null
  const sessionUser = fullUser?.user || fullUser
  const tenantId = sessionUser?.customerId

  useEffect(() => {
    // Attempt to fetch from backend, if no endpoint or empty, it will fall back to empty array
    if (tenantId) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      axios.get(`${API_URL}/api/v1/payment-methods/tenant/${tenantId}`, { headers })
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
             setData(res.data.map((pm: any) => ({
                cardCvv: '***',
                name: pm.name || 'Usuario Principal',
                expiryDate: `${pm.expMonth || '12'}/${pm.expYear ? String(pm.expYear).slice(-2) : '26'}`,
                imgAlt: pm.brand || 'Mastercard',
                badgeColor: 'primary',
                cardStatus: pm.isDefault ? 'Principal' : '',
                cardNumber: `**** **** **** ${pm.last4 || '0000'}`,
                imgSrc: pm.brand === 'VISA' ? '/images/logos/visa.png' : '/images/logos/mastercard.png'
             })))
          }
        })
        .catch(err => console.log("No payment methods found or endpoint doesn't exist", err))
    }
  }, [tenantId])

  const handleAddCard = () => {
    setCreditCard(-1)
  }

  const handleClickOpen = (index: number) => {
    setCreditCard(index)
  }

  // Vars
  const addButtonProps: ButtonProps = {
    variant: 'contained',
    children: 'Añadir Tarjeta',
    size: 'small',
    color: 'primary',
    startIcon: <i className='tabler-plus' />,
    onClick: handleAddCard
  }

  const editButtonProps = (index: number): ButtonProps => ({
    variant: 'tonal',
    children: 'Editar',
    size: 'small',
    onClick: () => handleClickOpen(index)
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Métodos de Pago'
          action={<OpenDialogOnElementClick element={Button} elementProps={addButtonProps} dialog={BillingCard} />}
        />
        <CardContent className='flex flex-col gap-4'>
          {data.length === 0 ? (
            <Alert severity="warning" icon={false} className="mt-2 text-center items-center flex-col justify-center">
              <Typography color="text.primary" variant="body1" className="mb-2">
                No tienes ningún método de pago registrado para cobros recurrentes.
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Añade una tarjeta para evitar interrupciones al finalizar tu período actual.
              </Typography>
            </Alert>
          ) : (
            data.map((item, index) => (
              <div
                key={index}
                className='flex justify-between border rounded sm:items-center p-6 flex-col !items-start sm:flex-row gap-2'
              >
                <div className='flex flex-col items-start gap-2'>
                  <img src={item.imgSrc} alt={item.imgAlt} height={25} />
                  <div className='flex items-center gap-2'>
                    <Typography className='font-medium' color='text.primary'>
                      {item.name}
                    </Typography>
                    {item.cardStatus ? (
                      <Chip color={item.badgeColor} label={item.cardStatus} size='small' variant='tonal' />
                    ) : null}
                  </div>
                  <Typography>
                    {item.cardNumber && item.cardNumber.slice(0, -4).replace(/[0-9]/g, '*') + item.cardNumber.slice(-4)}
                  </Typography>
                </div>
                <div className='flex flex-col gap-4'>
                  <div className='flex items-center justify-end gap-4'>
                    <OpenDialogOnElementClick
                      element={Button}
                      elementProps={editButtonProps(index)}
                      dialog={BillingCard}
                      dialogProps={{ data: data[creditCard] }}
                    />
                    <Button variant='tonal' color='error' size='small'>
                      Eliminar
                    </Button>
                  </div>
                  <Typography variant='body2'>La tarjeta vence el {item.expiryDate}</Typography>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default PaymentMethod
