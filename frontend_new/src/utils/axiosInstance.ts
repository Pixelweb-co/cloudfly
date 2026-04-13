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
            try {
                const token = localStorage.getItem('jwt')
                const activeTenantId = localStorage.getItem('activeTenantId')
                const activeCompanyId = localStorage.getItem('activeCompanyId')

                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                } else {
                    console.warn('⚠️ [AXIOS] No JWT token found in localStorage for request:', config.url)
                }

                if (activeTenantId) {
                    config.headers['X-Tenant-Id'] = activeTenantId
                }
                if (activeCompanyId) {
                    config.headers['X-Company-Id'] = activeCompanyId
                }

                // Log headers in development/debug
                if (activeTenantId || activeCompanyId) {
                    console.debug(`🔌 [AXIOS] Request: ${config.url} | Tenant: ${activeTenantId} | Company: ${activeCompanyId}`)
                }
            } catch (e) {
                console.error('Error setting auth headers:', e)
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
                    
                    // Clear technical token only, preserve visual context (userData) for the redirect phase
                    localStorage.removeItem('jwt')
                    
                    // FORCE REDIRECT to login
                    window.location.href = '/login'
                }
            }
        }

        return Promise.reject(error)
    }
)

export default axiosInstance
