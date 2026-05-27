'use client'

// Next Imports
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Component Imports
import LoginV2 from '@/views/pages/auth/LoginV2'

const LoginPage = () => {
  const router = useRouter()

  // Verificar si el usuario ya está autenticado y redirigir a /home
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    try {
      // Verificar si existe un token JWT válido
      const jwt = localStorage.getItem('jwt')
      const userData = localStorage.getItem('userData')

      // Si tiene token y datos de usuario, redirigir a home
      if (jwt && userData) {
        console.log('Usuario ya autenticado, redirigiendo a /home')
        router.replace('/home')
      }
    } catch (error) {
      console.error('Error checking authentication:', error)
      // Si hay error, continuar mostrando el login
    }
  }, [router])

  return <LoginV2 mode='light' />
}

export default LoginPage
