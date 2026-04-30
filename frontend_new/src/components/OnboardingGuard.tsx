'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { userMethods } from '@/utils/userMethods'

const OnboardingGuard = () => {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Avoid infinite redirect if already on account-setup
    if (pathname?.includes('account-setup')) return

    const checkOnboarding = () => {
      const user = userMethods.getUserLogin()
      
      if (user) {
        const roles = user.roles || []
        const isAdmin = roles.some((r: any) => r.name === 'ADMIN' || r.role === 'ADMIN')

        if (isAdmin && !user.onboardingCompleted) {
          console.log('🚧 [ONBOARDING-GUARD] Admin onboarding not completed. Redirecting...')
          router.push('/account-setup')
        }
      }
    }

    checkOnboarding()
  }, [pathname, router])

  return null
}

export default OnboardingGuard
