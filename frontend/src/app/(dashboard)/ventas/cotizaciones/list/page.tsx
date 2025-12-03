'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import axiosInstance from '@/utils/axiosInterceptor'
import { userMethods } from '@/utils/userMethods'
import QuotesList from '@views/apps/ventas/cotizaciones/list'
import type { QuoteType } from '@/types/apps/quoteType'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const QuotesListApp = () => {
    const [quotesData, setQuotesData] = useState<QuoteType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)

        try {
            const user = userMethods.getUserLogin()
            let quotes_url = `${API_BASE_URL}/quotes`

            if (user.roles[0].roleEnum === 'ADMIN' || user.roles[0].roleEnum === 'USER' || user.roles[0].roleEnum === 'SUPERADMIN') {
                const id_customer = user.customer.id
                quotes_url = `${API_BASE_URL}/quotes/tenant/${id_customer}`
            }

            const res = await axiosInstance.get(quotes_url)

            setLoading(false)
            setQuotesData(res.data)

            return res.data
        } catch (error) {
            console.error('Error fetching quotes data:', error)
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

    return <QuotesList quotesData={quotesData} reload={() => setReload(true)} />
}

export default QuotesListApp
