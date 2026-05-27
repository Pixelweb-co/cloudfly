'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'

import axios from 'axios'
import dotenv from "dotenv";

import ChecktemplateList from '@views/apps/checktemplates/list'

const getChecktemplateData = async () => {
  console.log('checktemplateList ', process.env.NEXT_PUBLIC_API_URL)

  try {
    // Recupera el token desde localStorage
    const token = localStorage.getItem('AuthToken')

    console.log('token ', token)

    if (!token) {
      throw new Error('Token no disponible. Por favor, inicia sesión nuevamente.')
    }

    // Realiza la petición con el token en el encabezado Authorization
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/plantillas`, {
      headers: {
        'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
        Authorization: `Bearer ${token}` // Añade el token en el encabezado
      }
    })

    return res.data
  } catch (error) {
    console.error('Error fetching checktemplate data:', error)
    throw error
  }
}

const ChecktemplateListApp = () => {
  const [checktemplateData, setChecktemplateData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getChecktemplateData()

        setChecktemplateData(data)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getChecktemplateData()

        console.log('Datos checktemplates', data)
        setChecktemplateData(data)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    console.log('reload 1', reload)

    fetchData()
    setReload(false)
  }, [reload])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error loading checktemplate data: {String(error)}</p>

  return <ChecktemplateList checkTemplateData={checktemplateData} reload={() => setReload(true)} />
}

export default ChecktemplateListApp
