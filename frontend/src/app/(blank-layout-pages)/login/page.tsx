// Next Imports
'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import LoginV2 from '@/views/pages/auth/LoginV2'
import { AuthManager } from '@/utils/authManager'

const LoginPage = () => {
  const router = useRouter()

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('UserLogin')
      if (!userStr) return
      const user = JSON.parse(userStr)
      const roles = user?.roles || []
      const hasRole = (role: string) => roles.some((r: any) => r.roleEnum === role)

      if (hasRole('SUPERADMIN') || hasRole('ADMIN')) {
        router.replace('/home')
      } else if (hasRole('USER') || hasRole('BIOMEDICAL') || hasRole('BIOEDICAL')) {
        router.replace('/accounts/user/view')
      } else {
        router.replace('/home')
      }
    } catch {}
  }, [router])

  return <LoginV2 mode='light' />
}

export default LoginPage
