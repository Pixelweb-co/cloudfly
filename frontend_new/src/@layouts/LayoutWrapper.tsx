'use client'

// React Imports
import { useEffect, useState, type ReactElement } from 'react'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { SystemMode } from '@core/types'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useLayoutInit from '@core/hooks/useLayoutInit'
import { AuthManager } from '@/utils/authManager'

type LayoutWrapperProps = {
  systemMode: SystemMode
  verticalLayout: ReactElement
  horizontalLayout: ReactElement
}

const LayoutWrapper = (props: LayoutWrapperProps) => {
  // Props
  const { systemMode, verticalLayout, horizontalLayout } = props

  const [isLogin, setIsLogin] = useState(false)

  // Estado de carga para evitar redirecciones prematuras
  const [isLoading, setIsLoading] = useState(true)

  // Hooks
  const { settings } = useSettings()

  useLayoutInit(systemMode)

  useEffect(() => {
    const checkAuth = async () => {
      console.log('Layout: Iniciando validación de sesión...')

      try {
        // Pausa artificial pequeña para asegurar que localStorage esté listo
        await new Promise(resolve => setTimeout(resolve, 100))

        const isValid = await AuthManager.validateToken()

        if (isValid) {
          console.log('Layout: Sesión válida.')
          setIsLogin(true)
        } else {
          console.warn('Layout: Sesión inválida o expirada. Redirigiendo...')
          setIsLogin(false)

          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
            
return
          }
        }
      } catch (error) {
        console.error('Layout: Error validando sesión', error)
        setIsLogin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Validación periódica cada 60 segundos
    const interval = setInterval(async () => {
      const isValid = await AuthManager.validateToken()

      if (!isValid) {
        console.warn('Layout: Sesión expirada durante intervalo.')
        setIsLogin(false)

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Loader mientras valida
  if (isLoading) {
    return (
      <div className='flex flex-col flex-auto items-center justify-center min-h-screen bg-backgroundPaper'>
        <div className='flex flex-col items-center gap-4'>
          <CircularProgress size={40} className='text-primary' />
          <span className='text-textSecondary font-medium'>Validando sesión...</span>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col flex-auto' data-skin={settings.skin}>
      {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
    </div>
  )
}

export default LayoutWrapper
