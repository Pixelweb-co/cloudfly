'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'
import InvoicesList from '@views/apps/ventas/facturas/list'
import type { InvoiceType } from '@/types/apps/invoiceType'



const InvoicesListApp = () => {
    const [invoicesData, setInvoicesData] = useState<InvoiceType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)

        try {
            const user = userMethods.getUserLogin()

            if (!user) {
                // If no user, maybe redirect or just stop
                console.error("No user data found")
                // window.location.href = '/login' // Optional: let the auth guard handle this
                setLoading(false)
                return
            }

            let invoices_url = '/invoices'

            // Safely check roles
            const userRole = user.roles?.[0]?.role
            if (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'SUPERADMIN') {
                const id_customer = user.customer?.id
                if (id_customer) {
                    invoices_url = `/invoices/tenant/${id_customer}`
                }
            }

            const res = await axiosInstance.get(invoices_url)

            setLoading(false)
            setInvoicesData(res.data)

            return res.data
        } catch (error) {
            console.error('Error fetching invoices data:', error)
            setLoading(false)
            // Rethrow or handle
            // throw error 
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
