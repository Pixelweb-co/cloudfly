'use client'

// React Imports
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Component Imports
import UserList from '@views/apps/user/list'
import { AuthManager } from '@/utils/authManager'
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
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // El backend ya filtra según el rol (MANAGER ve todos, otros solo su customer)
        const data = await getUserData()
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

  if (error) {
    AuthManager.logout()
    router.push('/login')

    return <p>Error cargando user data: {String(error)}</p>
  }

  return <UserList userData={userData} />
}

export default UserListApp
