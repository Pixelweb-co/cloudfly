'use client' // Esto indica que este archivo es un Componente del Cliente
// Component Imports
import { useEffect, useState } from 'react'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
import axios from 'axios'
import dotenv from "dotenv";

import ProductList from '@views/apps/products/list'

import { userMethods } from '@/utils/userMethods'

import { LinearProgress } from '@mui/material'

import axiosInstance from '@/utils/axiosInterceptor'


const ProductListApp = () => {
  const [productData, setProductData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])


  const fetchData = async () => {
    setLoading(true)

    try {

      // Recupera el token desde localStorage
      const token = localStorage.getItem('AuthToken')

      const user = userMethods.getUserLogin()


      let product_url = `${API_BASE_URL}/products`

      if (user.roles[0].roleEnum === 'ADMIN' || user.roles[0].roleEnum === 'USER') {

        const id_customer = user.customer.id

        product_url = `${API_BASE_URL}/products/customer/${id_customer}`

      }

      const res = await axiosInstance.get(product_url, {
        headers: {
          'Content-Type': 'application/json', // Asegúrate de que el contenido sea JSON
          Authorization: `Bearer ${token}` // Añade el token en el encabezado
        }
      })


      setLoading(false)
      setProductData(res.data)

      return res.data


    } catch (error) {
      console.error('Error fetching Product data:', error)
      setLoading(false)
      throw error

    }


  }


  useEffect(() => {

    fetchData()
    setReload(false)
  }, [reload])

  if (loading) return <LinearProgress color='info' />

  if (error) return window.location.href = '/login'

  return <ProductList productData={productData} reload={() => setReload(true)} />
}

export default ProductListApp
