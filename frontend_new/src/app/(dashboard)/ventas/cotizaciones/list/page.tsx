'use client'

import { useEffect, useState } from 'react'
import QuotesListTable from '@/views/ventas/cotizaciones/List/QuotesListTable'
import { axiosInstance } from '@/utils/axiosInstance'
import { toast } from 'react-hot-toast'

const QuotesPage = () => {
    const [quotes, setQuotes] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchQuotes = async () => {
        try {
            setLoading(true)
            // El backend resolverá tenantId y companyId automáticamente
            const res = await axiosInstance.get('/quotes')
            setQuotes(res.data)
        } catch (error) {
            console.error('Error fetching quotes:', error)
            toast.error('Error al cargar cotizaciones')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQuotes()
    }, [])

    if (loading) {
        return <div className="p-6 text-center">Cargando cotizaciones...</div>
    }

    return <QuotesListTable tableData={quotes} onReload={fetchQuotes} />
}

export default QuotesPage
