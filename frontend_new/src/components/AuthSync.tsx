'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * AuthSync Component
 * 
 * Synchronizes the NextAuth session token with localStorage so that 
 * legacy components using axiosInstance (which depends on localStorage)
 * can authenticate correctly.
 */
export const AuthSync = () => {
    const { data: session, status } = useSession()

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            const token = (session as any).accessToken
            const userData = JSON.stringify(session.user)

            if (token) {
                // Sync to localStorage for axiosInstance and other legacy scripts
                const currentToken = localStorage.getItem('jwt')
                if (currentToken !== token) {
                    console.log('🔄 [AUTH-SYNC] Synchronizing NextAuth session to localStorage...')
                    localStorage.setItem('jwt', token)
                    localStorage.setItem('userData', userData)
                    
                    // Trigger a storage event for other tabs/components
                    window.dispatchEvent(new Event('storage'))
                }
            }
        } else if (status === 'unauthenticated') {
            // Clear only the technical token, preserve visual context (userData) 
            // to avoid 'ghost' UI/vanishing combos during logout transitions.
            if (localStorage.getItem('jwt')) {
                console.warn('⚠️ [AUTH-SYNC] Session ended. Clearing token...')
                localStorage.removeItem('jwt')
            }
        }
    }, [session, status])

    return null // Invisible component
}

export default AuthSync
