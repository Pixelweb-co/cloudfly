'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

import VerifyEmailLink from '@/views/pages/auth/VerifyEmailLink'
import { AuthManager } from '@/utils/authManager'

const VerficateEmailPage = () => {
  const params = useParams()
  const [emailToken, setEmailToken] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const validate = async () => {
      if (!params?.id) return

      setEmailToken(String(params.id))
      console.log('Token almacenado:', params.id)

      try {
        const result = await AuthManager.validateAccount({ validationToken: String(params.id) })
        console.log('Resultado de validación:', result)
      } catch (error) {
        console.error('Error en validación:', error)
      } finally {
        setLoading(false)
      }
    }

    validate()
  }, [params])

  return (
    <div className='flex flex-col justify-center items-center min-h-screen p-6'>
      {loading ? <p>Validando...</p> : <VerifyEmailLink />}
    </div>
  )
}

export default VerficateEmailPage
