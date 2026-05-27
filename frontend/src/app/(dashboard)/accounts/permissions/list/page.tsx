'use client'

// React Imports
import { useEffect, useState } from 'react'

// Component Imports
import UserList from '@views/apps/user/list'
import { axiosInstance } from '@/utils/axiosInstance'

const getUserData = async () => {
  try {
    // axiosInstance ya incluye el token automáticamente
    const res = await axiosInstance.get('/users')
    return res.data
  } catch (error) {
    console.error('Error fetching user data:', error)
    throw error
  }
}

const UserListApp = () => {
  const [userData, setUserData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUserData()
        console.log('Datos', data)
        setUserData(data)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error loading user data: {String(error)}</p>

  return <UserList userData={userData} />
}

export default UserListApp
