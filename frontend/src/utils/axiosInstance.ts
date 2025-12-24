import axios from 'axios'

// Crear instancia de axios con configuración base
export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor para agregar el token a cada request
axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
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
            localStorage.removeItem('token')
            // Solo redirigir si no estamos ya en login
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default axiosInstance
