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
            
            if (token) {
                const currentToken = localStorage.getItem('jwt')
                const prevUserData = localStorage.getItem('userData')
                const newUserData = JSON.stringify(session.user)

                if (currentToken !== token || prevUserData !== newUserData) {
                    console.log('🔄 [AUTH-SYNC] Session authenticated. Syncing to localStorage...')
                    localStorage.setItem('jwt', token)
                    localStorage.setItem('userData', newUserData)
                    window.dispatchEvent(new Event('storage'))
                }
            }
        } else if (status === 'unauthenticated') {
            // Only clear if we actually have a token but no session
            if (localStorage.getItem('jwt')) {
                console.warn('⚠️ [AUTH-SYNC] No session found. Clearing technical token...')
                localStorage.removeItem('jwt')
                window.dispatchEvent(new Event('storage'))
            }
        } else {
            // Status is 'loading' - we keep what we have in localStorage to avoid 401s during transitions
            if (localStorage.getItem('jwt')) {
                console.debug('⏳ [AUTH-SYNC] Session loading... keeping existing token.')
            }
        }
    }, [session, status])

    return null // Invisible component
}

export default AuthSync
