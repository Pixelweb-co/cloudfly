import { useState, useEffect } from 'react'
import { axiosInstance } from '@/utils/axiosInstance'
import type { UserPermissions } from '@/types/rbac'

interface UsePermissionsReturn {
    permissions: string[]
    modules: string[]
    roles: string[]
    menu: UserPermissions['menu']
    loading: boolean
    error: Error | null
    hasModule: (moduleCode: string) => boolean
    hasPermission: (permission: string) => boolean
    hasAnyRole: (...roleCodes: string[]) => boolean
}

export function usePermissions(): UsePermissionsReturn {
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                setLoading(true)
                const response = await axiosInstance.get<UserPermissions>('/api/rbac/menu')
                setUserPermissions(response.data)
                setError(null)
            } catch (err) {
                setError(err as Error)
                console.error('Error fetching user permissions:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchPermissions()
    }, [])

    const hasModule = (moduleCode: string): boolean => {
        if (!userPermissions) return false
        const upperCode = moduleCode.toUpperCase()
        return userPermissions.modules.some(m => m.toUpperCase() === upperCode)
    }

    const hasPermission = (permission: string): boolean => {
        if (!userPermissions) return false
        return userPermissions.permissions.includes(permission)
    }

    const hasAnyRole = (...roleCodes: string[]): boolean => {
        if (!userPermissions) return false
        return roleCodes.some(role =>
            userPermissions.roles.some(userRole =>
                userRole.toUpperCase() === role.toUpperCase()
            )
        )
    }

    return {
        permissions: userPermissions?.permissions || [],
        modules: userPermissions?.modules || [],
        roles: userPermissions?.roles || [],
        menu: userPermissions?.menu || [],
        loading,
        error,
        hasModule,
        hasPermission,
        hasAnyRole
    }
}

export default usePermissions
