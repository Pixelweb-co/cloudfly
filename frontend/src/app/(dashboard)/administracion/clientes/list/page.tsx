'use client'

// Component Imports
import { useEffect, useState } from 'react'

import axiosInstance from '@/utils/axiosInstance'
import CustomerList from '@views/apps/customers/list'

const getCustomerData = async () => {
  try {
    const res = await axiosInstance.get('/customers')
    return res.data
  } catch (error) {
    console.error('Error fetching customer data:', error)
    throw error
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
