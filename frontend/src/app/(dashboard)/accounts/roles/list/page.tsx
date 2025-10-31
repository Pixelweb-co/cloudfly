'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

// eslint-disable-next-line import/no-unresolved
import RoleList from '@/views/apps/roles/list'

const getRoleData = async () => {
  console.log('roleList ', process.env.NEXT_PUBLIC_API_URL)

  try {
    // Recupera el token desde localStorage
    const token = localStorage.getItem('AuthToken')

    console.log('token ', token)

    // Realiza la petición con el token en el encabezado Authorization
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/roles`, {
      headers: {
        'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
        Authorization: `Bearer ${token}` // Añade el token en el encabezado
      }
    })

    return res.data
  } catch (error) {
    console.error('Error fetching role data:', error)
    throw error
  }
}

const RoleListApp = () => {
  const [roleData, setRoleData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRoleData()

        console.log('Datos', data)
        setRoleData(data)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error loading role data: {String(error)}</p>

  return <RoleList roleData={roleData} />
}

export default RoleListApp
