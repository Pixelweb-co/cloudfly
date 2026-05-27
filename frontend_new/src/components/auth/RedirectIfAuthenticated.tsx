'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const RedirectIfAuthenticated = () => {
    const router = useRouter()

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            const jwt = localStorage.getItem('jwt')
            const userData = localStorage.getItem('userData')

            if (jwt && jwt !== 'undefined' && userData) {
                // Decodificar el token JWT de manera simple para validar la fecha de vencimiento
                try {
                    const payload = JSON.parse(atob(jwt.split('.')[1]))
                    const isExpired = payload.exp * 1000 < Date.now()
                    if (isExpired) {
                        console.warn('⚠️ [REDIRECT-IF-AUTH] Token expired. Clearing credentials and keeping user on login page.')
                        localStorage.removeItem('jwt')
                        localStorage.removeItem('userData')
                        return
                    }
                } catch (e) {
                    console.error('⚠️ [REDIRECT-IF-AUTH] Failed to parse JWT payload', e)
                }

                const user = JSON.parse(userData)
                const roles = user?.roles || []
                const isAdmin = roles.some((r: any) => r.name === 'ADMIN' || r.role === 'ADMIN')
                const onboardingIncomplete = !user?.onboardingCompleted

                if (isAdmin && onboardingIncomplete) {
                    console.log('🚧 [REDIRECT-IF-AUTH] ADMIN onboarding incomplete. Redirecting to /account-setup')
                    router.replace('/account-setup')
                } else {
                    console.log('✅ [REDIRECT-IF-AUTH] Redirecting to /home')
                    router.replace('/home')
                }
            }
        } catch (error) {
            console.error('Error checking authentication:', error)
        }
    }, [router])

    return null
}

export default RedirectIfAuthenticated
