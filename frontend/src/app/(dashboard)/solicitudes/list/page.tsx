'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

import SolicitudList from '@views/apps/solicitudes/list'
import { userMethods } from '@/utils/userMethods'
import axiosInstance from '@/utils/axiosInterceptor'
import { LinearProgress } from '@mui/material'

const getSolicitudData = async () => {
  console.log('solicitudList ', process.env.NEXT_PUBLIC_API_URL)

  try {
    // Recupera el token desde localStorage
    const token = localStorage.getItem('AuthToken')

    console.log('token ', token)

    if (!token) {
      throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
    }

    // Realiza la petición con el token en el encabezado Authorization
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/solicitudes`, {
      headers: {
        'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
        Authorization: `Bearer ${token}` // Añade el token en el encabezado
      }
    })

    return res.data
  } catch (error) {
    console.error('Error fetching solicitud data:', error)
    throw error
  }
}

const SolicitudListApp = () => {
  const [solicitudData, setSolicitudData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    try {

      // Recupera el token desde localStorage
      const token = localStorage.getItem('AuthToken')

      const user = userMethods.getUserLogin()


      let product_url = `${process.env.NEXT_PUBLIC_API_URL}/solicitudes`

      if (user.roles[0].roleEnum === 'ADMIN' || user.roles[0].roleEnum === 'USER') {

        const id_customer = user.customer.id

        product_url = `${process.env.NEXT_PUBLIC_API_URL}/solicitudes/customer/${id_customer}`

      }

      const res = await axiosInstance.get(product_url, {
        headers: {
          'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
          Authorization: `Bearer ${token}` // Añade el token en el encabezado
        }
      })


      setLoading(false)
      setSolicitudData(res.data)

      return res.data


    } catch (error) {
      console.error('Error fetching Product data:', error)
      setLoading(false)
      throw error

    }


  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {

    if(reload){
    fetchData()
    setReload(false)
    }
  }, [reload])

 if (loading) return <LinearProgress color='info' />

   if (error) return window.location.href = '/login'

  return <SolicitudList solicitudData={solicitudData} reload={() => setReload(true)} />
}

export default SolicitudListApp
