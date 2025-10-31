'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import axios from 'axios'
import dotenv from "dotenv";
import UserList from '@views/apps/user/list'
import { userMethods } from '@/utils/userMethods'
import { AuthManager } from '@/utils/authManager'



const getUserData = async () => {
  console.log('userList ', process.env.NEXT_PUBLIC_API_URL)

  try {
    // Recupera el token desde localStorage
    const token = localStorage.getItem('AuthToken')

    console.log('token ', token)

    // Realiza la petición con el token en el encabezado Authorization
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      headers: {
        'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
        Authorization: `Bearer ${token}` // Añade el token en el encabezado
      }
    })

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
        const data = await getUserData()

        if (userMethods.isRole('ADMIN')) {
          const userLogin = userMethods.getUserLogin()

          console.log('data users', data)
          const dataf = data.filter((item: any) => item.customer && item.customer.id === userLogin.customer.id)

          console.log('data users f', dataf)
          setUserData(dataf)
        } else {
          const dataf = data

          setUserData(dataf)
        }
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
