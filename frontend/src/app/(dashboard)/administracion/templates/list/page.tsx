'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

import TypeServiceListTable from '../../../../../views/apps/typeService/list/TypeServiceListTable'

const getTypeServiceData = async () => {
  console.log('TypeServiceList ', process.env.NEXT_PUBLIC_API_URL)

  try {
    // Recupera el token desde localStorage
    const token = localStorage.getItem('AuthToken')

    console.log('token ', token)

    // Realiza la petición con el token en el encabezado Authorization
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/type-service`, {
      headers: {
        'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
        Authorization: `Bearer ${token}` // Añade el token en el encabezado
      }
    })

    return res.data
  } catch (error) {
    console.error('Error fetching TypeService data:', error)
    throw error
  }
}

const TemplateList = () => {
  const [TypeServiceData, setTypeServiceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = async () => {
    try {
      const data = await getTypeServiceData()

      console.log('Datostp', data)
      setTypeServiceData(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTypeServiceData()

        console.log('Datos', data)
        setTypeServiceData(data)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error loading TypeService data: {String(error)}</p>

  return <TypeServiceListTable tableData={TypeServiceData} reload={()=>reload()}/>
}

export default TemplateList
