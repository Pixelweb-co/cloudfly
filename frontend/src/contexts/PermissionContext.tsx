'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

import type { MenuItem, UserPermissions } from '@/types/rbac'
import { getMyPermissions, hasPermission, hasModuleAccess, hasRole, isAdmin, isSuperAdmin } from '@/services/rbac/rbacService'

interface PermissionContextType {
    // State
    isLoading: boolean
    error: string | null
    permissions: string[]
    roles: string[]
    modules: string[]
    menu: MenuItem[]
    username: string | null

    // Methods
    refreshPermissions: () => Promise<void>

    // Permission checks
    can: (module: string, action: string) => boolean
    canAccessModule: (module: string) => boolean
    hasRole: (role: string) => boolean
    isAdmin: () => boolean
    isSuperAdmin: () => boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

interface PermissionProviderProps {
    children: ReactNode
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)

    const fetchPermissions = useCallback(async () => {
        // Check if user is logged in
        const token = typeof window !== 'undefined' ? localStorage.getItem('AuthToken') : null

        if (!token) {
            setIsLoading(false)

            return
        }

        try {
            setIsLoading(true)
            setError(null)
            const data = await getMyPermissions()

            setUserPermissions(data)
        } catch (err) {
            console.error('Failed to fetch permissions:', err)
            setError('Error al cargar permisos')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Load permissions on mount
    useEffect(() => {
        fetchPermissions()
    }, [fetchPermissions])

    // Permission check methods
    const can = useCallback((module: string, action: string): boolean => {
        if (!userPermissions) return false

        return hasPermission(userPermissions.permissions, module, action)
    }, [userPermissions])

    const canAccessModule = useCallback((module: string): boolean => {
        if (!userPermissions) return false

        return hasModuleAccess(userPermissions.permissions, module)
    }, [userPermissions])

    const checkHasRole = useCallback((role: string): boolean => {
        if (!userPermissions) return false

        return hasRole(userPermissions.roles, role)
    }, [userPermissions])

    const checkIsAdmin = useCallback((): boolean => {
        if (!userPermissions) return false

        return isAdmin(userPermissions.roles)
    }, [userPermissions])

    const checkIsSuperAdmin = useCallback((): boolean => {
        if (!userPermissions) return false

        return isSuperAdmin(userPermissions.roles)
    }, [userPermissions])

    const value: PermissionContextType = {
        isLoading,
        error,
        permissions: userPermissions?.permissions || [],
        roles: userPermissions?.roles || [],
        modules: userPermissions?.modules || [],
        menu: userPermissions?.menu || [],
        username: userPermissions?.username || null,
        refreshPermissions: fetchPermissions,
        can,
        canAccessModule,
        hasRole: checkHasRole,
        isAdmin: checkIsAdmin,
        isSuperAdmin: checkIsSuperAdmin
    }

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    )
}

// Hook to use permissions
export const usePermissions = (): PermissionContextType => {
    const context = useContext(PermissionContext)

    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionProvider')
    }

    return context
}

// Export context for direct access if needed
export { PermissionContext }
