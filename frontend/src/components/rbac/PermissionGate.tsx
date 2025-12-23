'use client'

import React, { ReactNode } from 'react'

import { usePermissions } from '@/contexts/PermissionContext'

interface PermissionGateProps {
    children: ReactNode

    // Permission requirements (at least one must be met)
    module?: string
    action?: string

    // Role requirements
    role?: string
    roles?: string[]

    // Require admin access
    requireAdmin?: boolean
    requireSuperAdmin?: boolean

    // Fallback content when permission denied
    fallback?: ReactNode

    // Show nothing instead of fallback
    hideOnDeny?: boolean
}

/**
 * PermissionGate - Conditionally renders children based on user permissions
 * 
 * Examples:
 * <PermissionGate module="accounting" action="read">
 *   <AccountingDashboard />
 * </PermissionGate>
 * 
 * <PermissionGate role="ADMIN">
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * <PermissionGate requireSuperAdmin fallback={<AccessDenied />}>
 *   <SuperAdminPanel />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
    children,
    module,
    action,
    role,
    roles,
    requireAdmin,
    requireSuperAdmin,
    fallback = null,
    hideOnDeny = true
}) => {
    const { can, canAccessModule, hasRole, isAdmin, isSuperAdmin, isLoading } = usePermissions()

    // While loading, don't render anything
    if (isLoading) {
        return null
    }

    let hasAccess = false

    // Check specific permission (module + action)
    if (module && action) {
        hasAccess = can(module, action)
    }
    // Check module access (any action)
    else if (module && !action) {
        hasAccess = canAccessModule(module)
    }
    // Check specific role
    else if (role) {
        hasAccess = hasRole(role)
    }
    // Check multiple roles (any of them)
    else if (roles && roles.length > 0) {
        hasAccess = roles.some(r => hasRole(r))
    }
    // Check admin requirement
    else if (requireAdmin) {
        hasAccess = isAdmin()
    }
    // Check superadmin requirement
    else if (requireSuperAdmin) {
        hasAccess = isSuperAdmin()
    }
    // If no requirements specified, allow access
    else {
        hasAccess = true
    }

    if (hasAccess) {
        return <>{children}</>
    }

    if (hideOnDeny) {
        return null
    }

    return <>{fallback}</>
}

/**
 * Hook version for more flexibility
 */
export const useCanAccess = (
    module?: string,
    action?: string,
    options?: {
        role?: string
        roles?: string[]
        requireAdmin?: boolean
        requireSuperAdmin?: boolean
    }
): boolean => {
    const { can, canAccessModule, hasRole, isAdmin, isSuperAdmin } = usePermissions()

    if (module && action) {
        return can(module, action)
    }

    if (module && !action) {
        return canAccessModule(module)
    }

    if (options?.role) {
        return hasRole(options.role)
    }

    if (options?.roles && options.roles.length > 0) {
        return options.roles.some(r => hasRole(r))
    }

    if (options?.requireAdmin) {
        return isAdmin()
    }

    if (options?.requireSuperAdmin) {
        return isSuperAdmin()
    }

    return true
}

export default PermissionGate
