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
                let mergedUser = { ...session.user } as any

                // 🔥 Prevent race conditions during Onboarding/Wizard setup:
                // If local storage has already been updated with customerId / activeCompanyId
                // but the NextAuth session is still updating asynchronously in the background,
                // do not let the stale session wipe out the local storage values.
                if (prevUserData) {
                    try {
                        const prev = JSON.parse(prevUserData)
                        if (prev && typeof prev === 'object') {
                            if (prev.customerId && !mergedUser.customerId) {
                                console.log('🔄 [AUTH-SYNC] Merging customerId from local storage into session user to avoid race condition.')
                                mergedUser.customerId = prev.customerId
                            }
                            if (prev.activeCompanyId && !mergedUser.activeCompanyId) {
                                mergedUser.activeCompanyId = prev.activeCompanyId
                            }
                            if (prev.customer && !mergedUser.customer) {
                                mergedUser.customer = prev.customer
                            }
                        }
                    } catch (e) {
                        console.error('[AUTH-SYNC] Error parsing prevUserData:', e)
                    }
                }

                const newUserData = JSON.stringify(mergedUser)

                if (currentToken !== token || prevUserData !== newUserData) {
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
