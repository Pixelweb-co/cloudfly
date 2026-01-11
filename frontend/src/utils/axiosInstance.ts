'use client'

import axios from 'axios'

// Crear instancia de axios con configuración base
export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    }
})

// Interceptor para agregar el token a cada request
axiosInstance.interceptors.request.use(
    config => {
        // Solo acceder a localStorage en el cliente (no en SSR)
        if (typeof window !== 'undefined') {
            // ESTANDARIZADO: usar "jwt" que es el nombre que devuelve la API
            const token = localStorage.getItem('jwt')

            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// Interceptor para manejar respuestas
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        // Redirigir al login si el token expiró o no es válido
        if (error.response?.status === 401) {
            // Solo en el cliente
            if (typeof window !== 'undefined') {
                // ESTANDARIZADO: limpiar "jwt"
                localStorage.removeItem('jwt')
                localStorage.removeItem('userData')

                // COMENTADO PARA DEBUG - Solo redirigir si no estamos ya en login
                // if (!window.location.pathname.includes('/login')) {
                //     window.location.href = '/login'
                // }
                console.error('401 Unauthorized - Token inválido o expirado')
            }
        }
        return Promise.reject(error)
    }
)

export default axiosInstance
