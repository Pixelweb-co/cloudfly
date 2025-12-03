'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import axiosInstance from '@/utils/axiosInterceptor'
import { userMethods } from '@/utils/userMethods'
import OrdersList from '@views/apps/ventas/pedidos/list'
import type { Order } from '@/types/apps/Types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const OrdersListApp = () => {
  const [ordersData, setOrdersData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    try {
      const user = userMethods.getUserLogin()
      let orders_url = `${API_BASE_URL}/orders`

      if (user.roles[0].roleEnum === 'ADMIN' || user.roles[0].roleEnum === 'USER' || user.roles[0].roleEnum === 'SUPERADMIN') {
        const id_customer = user.customer.id
        orders_url = `${API_BASE_URL}/orders/tenant/${id_customer}`
      }

      const res = await axiosInstance.get(orders_url)

      setLoading(false)
      setOrdersData(res.data)

      return res.data
    } catch (error) {
      console.error('Error fetching orders data:', error)
      setLoading(false)
      throw error
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (reload) {
      fetchData()
      setReload(false)
    }
  }, [reload])

  if (loading) return <LinearProgress color='info' />

  if (error) {
    window.location.href = '/login'
    return null
  }

  return <OrdersList ordersData={ordersData} reload={() => setReload(true)} />
}

export default OrdersListApp
