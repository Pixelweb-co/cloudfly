'use client'

// Component Imports
import { useEffect, useState } from 'react'

import axiosInstance from '@/utils/axiosInstance'
import CustomerList from '@/views/apps/customers/list'

// Mock data generator for fallback
const getMockData = () => {
    return [
        {
            id: 1,
            name: 'Empresa Demo S.A.S',
            nit: '900123456',
            digitoVerificacion: '1',
            email: 'contacto@demo.com',
            phone: '3001234567',
            address: 'Calle 123 # 45-67',
            contact: 'Juan Pérez',
            status: true,
            ciudadDian: 'Bogotá',
            departamentoDian: 'Cundinamarca',
            esEmisorFE: true
        }
    ]
}

const getCustomerData = async () => {
    try {
        const res = await axiosInstance.get('/customers')

        
return res.data
    } catch (error) {
        console.warn('Error fetching customer data, using mock:', error)

        // Return mock data if API fails (e.g. backend not ready)
        return getMockData()
    }
}

const CustomerListApp = () => {
    const [customerData, setCustomerData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)

        try {
            const data = await getCustomerData()

            setCustomerData(data)
            setError(null)
        } catch (err: any) {
            setError(err.message || 'Error loading data')
        } finally {
            setLoading(false)
        }
    }

    // Initial load
    useEffect(() => {
        fetchData()
    }, [])

    // Reload when requested
    useEffect(() => {
        if (reload) {
            fetchData()
            setReload(false)
        }
    }, [reload])

    if (loading && customerData.length === 0) return <p>Loading...</p>
    if (error && customerData.length === 0) return <p>Error loading customer data: {error}</p>

    return <CustomerList customerData={customerData} reload={() => setReload(true)} />
}

export default CustomerListApp
