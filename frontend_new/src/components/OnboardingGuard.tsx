'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { userMethods } from '@/utils/userMethods'

const OnboardingGuard = () => {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkOnboarding = () => {
      const user = userMethods.getUserLogin()
      console.log('useronboarding ----------------> :', user)

      if (user) {
        const roles = user.roles || []
        const isAdmin = roles.some((r: any) => r.name === 'ADMIN' || r.role === 'ADMIN')
        const isSetupPage = pathname?.includes('/account-setup')

        if (isAdmin) {
          if (!user.onboardingCompleted && !isSetupPage) {
            console.log('🚧 [ONBOARDING-GUARD] Admin onboarding not completed. Redirecting to /account-setup...')
            router.push('/account-setup')
          } else if (user.onboardingCompleted && isSetupPage) {
            console.log('✅ [ONBOARDING-GUARD] Admin onboarding already completed. Redirecting to /home...')
            router.push('/home')
          }
        }
      }
    }

    checkOnboarding()
  }, [pathname, router])

  return null
}

export default OnboardingGuard
