'use client'

import axios from 'axios'

export const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor para agregar el token a cada request
axiosInstance.interceptors.request.use(
    config => {
        if (typeof window !== 'undefined') {
            // Priority: localStorage (for legacy/migration)
            let token = localStorage.getItem('jwt')

            // If no token in localStorage, we should NOT hang, just continue.
            // The AuthSync component will eventually sync the NextAuth token here.

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
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                console.error('🔴 [AXIOS-INSTANCE] 401 Unauthorized detected for:', error.config?.url)

                const path = window.location.pathname
                
                // ONLY redirect if we are NOT already on an auth page
                const isAuthPage = path.includes('/login') || path.includes('/register') || path.includes('/recover-password')

                if (!isAuthPage) {
                    console.warn('⚠️ [AXIOS-INSTANCE] Session might be invalid. Redirecting to login...')
                    
                    // Clear broken data
                    localStorage.removeItem('jwt')
                    localStorage.removeItem('userData')
                    
                    // FORCE REDIRECT to login
                    window.location.href = '/login'
                }
            }
        }

        return Promise.reject(error)
    }
)

export default axiosInstance
