'use client'

import { useEffect, useState } from 'react'
import RoleList from '@/views/apps/roles/list'
import axiosInstance from '@/utils/axiosInterceptor'

const RoleListApp = () => {
  const [roleData, setRoleData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await axiosInstance.get('/api/roles')
        setRoleData(res.data)
      } catch (err: any) {
        console.error('Error loading roles:', err)
        setError('Error cargando roles')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p>Cargando roles...</p>
  if (error) return <p>{error}</p>

  return <RoleList roleData={roleData} />
}

export default RoleListApp
