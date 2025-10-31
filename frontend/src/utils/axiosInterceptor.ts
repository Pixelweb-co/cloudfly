import { useRouter } from 'next/navigation'
import axios from 'axios'

// Base URL dinámica desde variable de entorno
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Crear una instancia personalizada de Axios
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Tiempo máximo de espera en ms
})

// Interceptor de solicitudes
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('AuthToken')

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    console.log(`[Request] ${config.method.toUpperCase()} ${config?.url}`, config)
    return config
  },
  (error) => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

// Interceptor de respuestas
axiosInstance.interceptors.response.use(
  (response: any) => {
    console.log('[Response]', response)
    return response
  },
  (error) => {
    if (error.response) {
      console.error('[Response Error]', error.response)

      if (error.response.status === 401) {
        console.log('Token inválido o expirado. Redirigiendo al login...')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
