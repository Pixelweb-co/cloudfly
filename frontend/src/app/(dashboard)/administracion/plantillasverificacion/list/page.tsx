'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'

import axios from 'axios'
import dotenv from "dotenv";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
import TypeDeviceListTable from '../../../../../views/apps/typeDevice/list/TypeDeviceListTable'

import axiosInstance from '@/utils/axiosInterceptor'
import TemplateVerificationListTable from '@/views/apps/templateVerification/list/TemplateVerificationListTable'

const getTemplatesVerification = async () => {

  try {
    const response = await axiosInstance.get(`${API_BASE_URL}/plantillas-verificacion`);

    console.log('Datos recibidosnw:', response.data);

    return response.data;

  } catch (error) {

    console.error('Error al obtener los datos:', error);
  }

}

const TemplateVListApp = () => {
  const [TypeDeviceData, setTypeDeviceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = async () => {
    try {
      const data = await getTemplatesVerification()

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
        const data = await getTemplatesVerification()

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
  if (error) return <p>Error loading template data: {String(error)}</p>

  return <TemplateVerificationListTable tableData={TypeDeviceData} reload={()=>reload()}/>
}

export default TemplateVListApp
