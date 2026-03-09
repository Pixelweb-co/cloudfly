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

            if (jwt && userData) {
                console.log('Usuario ya autenticado, redirigiendo a /home')
                router.replace('/home')
            }
        } catch (error) {
            console.error('Error checking authentication:', error)
        }
    }, [router])

    return null
}

export default RedirectIfAuthenticated
