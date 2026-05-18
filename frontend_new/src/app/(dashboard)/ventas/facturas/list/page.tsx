'use client'

import { useEffect, useState } from 'react'
import InvoicesListTable from '@/views/ventas/facturas/List/InvoicesListTable'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-hot-toast'

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchInvoices = async () => {
        try {
            setLoading(true)
            const res = await axiosInstance.get('/invoices')
            setInvoices(res.data)
        } catch (error) {
            console.error('Error fetching invoices:', error)
            toast.error('Error al cargar facturas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInvoices()
    }, [])

    if (loading) {
        return <div className="p-6 text-center">Cargando facturas...</div>
    }

    return <InvoicesListTable tableData={invoices} onReload={fetchInvoices} />
}

export default InvoicesPage
