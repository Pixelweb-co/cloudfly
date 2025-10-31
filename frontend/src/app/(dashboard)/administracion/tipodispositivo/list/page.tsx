'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

import TypeDeviceListTable from '../../../../../views/apps/typeDevice/list/TypeDeviceListTable'

// eslint-disable-next-line import/no-unresolved
import axiosInstance from '@/utils/axiosInterceptor'

const getTypeDeviceData = async () => {

  try {
    const response = await axiosInstance.get('/type-device');

    console.log('Datos recibidosnw:', response.data);

    return response.data;

  } catch (error) {

    console.error('Error al obtener los datos:', error);
  }

}

const getTypeDeviceData2 = async () => {
  console.log('TypeDeviceList ', process.env.NEXT_PUBLIC_API_URL)

  try {
    // Recupera el token desde localStorage
    const token = localStorage.getItem('AuthToken')

    console.log('token ', token)

    // Realiza la petición con el token en el encabezado Authorization
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/type-device`, {
      headers: {
        'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
        Authorization: `Bearer ${token}` // Añade el token en el encabezado
      }
    })

    return res.data
  } catch (error) {
    console.error('Error fetching TypeDevice data:', error)
    throw error
  }
}

const TypeDeviceListApp = () => {
  const [TypeDeviceData, setTypeDeviceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = async () => {
    try {
      const data = await getTypeDeviceData()

   //   console.log('Datostp', data)
      setTypeDeviceData(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTypeDeviceData()

     //   console.log('Datos', data)
        setTypeDeviceData(data)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error loading TypeDevice data: {String(error)}</p>

  return <TypeDeviceListTable tableData={TypeDeviceData} reload={()=>reload()}/>
}

export default TypeDeviceListApp
