'use client'

import { useEffect, useState } from 'react'
import OrdersListTable from '@/views/ventas/pedidos/List/OrdersListTable'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-hot-toast'

const OrdersPage = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchOrders = async () => {
        try {
            setLoading(true)
            // El backend resolverá tenantId y companyId automáticamente
            const res = await axiosInstance.get('/orders')
            setOrders(res.data)
        } catch (error) {
            console.error('Error fetching orders:', error)
            toast.error('Error al cargar pedidos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    if (loading) {
        return <div className="p-6 text-center">Cargando pedidos...</div>
    }

    return <OrdersListTable tableData={orders} onReload={fetchOrders} />
}

export default OrdersPage
