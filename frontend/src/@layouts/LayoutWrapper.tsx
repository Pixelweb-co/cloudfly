'use client'

// React Imports
import { useEffect, useState, type ReactElement } from 'react'

// Type Imports
import type { SystemMode } from '@core/types'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useLayoutInit from '@core/hooks/useLayoutInit'
import { AuthManager } from '@/utils/authManager';

type LayoutWrapperProps = {
  systemMode: SystemMode
  verticalLayout: ReactElement
  horizontalLayout: ReactElement
}

const LayoutWrapper = (props: LayoutWrapperProps) => {
  // Props
  const { systemMode, verticalLayout, horizontalLayout } = props

  const [isLogin, setIsLogin] = useState(false)

  // Hooks
  const { settings } = useSettings()

  useLayoutInit(systemMode)


    useEffect(() => {

      const validity = async  () => {
      console.log('Layout mounted validate token and user')

      const logined = await AuthManager.validateToken()
      if (logined) {
        console.log('Token is valid')
        setIsLogin( logined)
      }

      const interval = setInterval(async () => {
        console.log('Interval')
      const logined = await AuthManager.validateToken()

      if (logined) {
        console.log('Token is valid')
        setIsLogin( logined)
      } else {
        console.log('Token is invalid')
        clearInterval(interval)
        setIsLogin( logined)
      }

      setIsLogin( logined)


      }, 60000);

    }


      validity()


    }, [])

  // Return the layout based on the layout context
  return (
    <div className='flex flex-col flex-auto' data-skin={settings.skin}>
      {!isLogin && <div style={{backgroundColor:'white',width:'100%', height:'100%', position:'absolute',zIndex:'99999'}}></div>}
      {settings.layout === 'horizontal' ? horizontalLayout : verticalLayout}
    </div>
  )
}

export default LayoutWrapper
