'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'
import InvoicesList from '@views/apps/ventas/facturas/list'
import type { InvoiceType } from '@/types/apps/invoiceType'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const InvoicesListApp = () => {
    const [invoicesData, setInvoicesData] = useState<InvoiceType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)

        try {
            const user = userMethods.getUserLogin()
            let invoices_url = `${API_BASE_URL}/invoices`

            if (user.roles[0].role === 'ADMIN' || user.roles[0].role === 'USER' || user.roles[0].role === 'SUPERADMIN') {
                const id_customer = user.customer.id
                invoices_url = `${API_BASE_URL}/invoices/tenant/${id_customer}`
            }

            const res = await axiosInstance.get(invoices_url)

            setLoading(false)
            setInvoicesData(res.data)

            return res.data
        } catch (error) {
            console.error('Error fetching invoices data:', error)
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

    return <InvoicesList invoicesData={invoicesData} reload={() => setReload(true)} />
}

export default InvoicesListApp
