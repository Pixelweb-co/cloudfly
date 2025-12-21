/**
 * RBAC Service - API calls for Role-Based Access Control
 */

import type { MenuItem, Role, UserPermissions, RoleRequest, ModulePermission } from '@/types/rbac'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Helper to get auth headers
const getAuthHeaders = (token?: string | null): HeadersInit => {
    const finalToken = token || (typeof window !== 'undefined' ? localStorage.getItem('AuthToken') : null)

    return {
        'Content-Type': 'application/json',
        ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {})
    }
}

/**
 * Get menu for current user
 * Replaces static verticalMenuData.json
 */
export const getMenu = async (token?: string): Promise<MenuItem[]> => {
    const response = await fetch(`${API_URL}/api/rbac/menu`, {
        method: 'GET',
        headers: getAuthHeaders(token)
    })

    if (!response.ok) {
        throw new Error('Failed to fetch menu')
    }

    return response.json()
}

/**
 * Get all permissions for current user
 */
export const getMyPermissions = async (): Promise<UserPermissions> => {
    const response = await fetch(`${API_URL}/api/rbac/my-permissions`, {
        method: 'GET',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to fetch permissions')
    }

    return response.json()
}

/**
 * Check if current user has a specific permission
 */
export const checkPermission = async (module: string, action: string): Promise<boolean> => {
    const response = await fetch(
        `${API_URL}/api/rbac/check?module=${module}&action=${action}`,
        {
            method: 'GET',
            headers: getAuthHeaders()
        }
    )

    if (!response.ok) {
        return false
    }

    return response.json()
}

/**
 * Get all roles (admin only)
 */
export const getAllRoles = async (): Promise<Role[]> => {
    const response = await fetch(`${API_URL}/api/rbac/roles`, {
        method: 'GET',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to fetch roles')
    }

    return response.json()
}

/**
 * Get role by ID
 */
export const getRoleById = async (id: number): Promise<Role> => {
    const response = await fetch(`${API_URL}/api/rbac/roles/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to fetch role')
    }

    return response.json()
}

/**
 * Get role by code
 */
export const getRoleByCode = async (code: string): Promise<Role> => {
    const response = await fetch(`${API_URL}/api/rbac/roles/code/${code}`, {
        method: 'GET',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to fetch role')
    }

    return response.json()
}

/**
 * Create a new role (SUPERADMIN only)
 */
export const createRole = async (role: RoleRequest): Promise<Role> => {
    const response = await fetch(`${API_URL}/api/rbac/roles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(role)
    })

    if (!response.ok) {
        throw new Error('Failed to create role')
    }

    return response.json()
}

/**
 * Update a role (SUPERADMIN only)
 */
export const updateRole = async (id: number, role: RoleRequest): Promise<Role> => {
    const response = await fetch(`${API_URL}/api/rbac/roles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(role)
    })

    if (!response.ok) {
        throw new Error('Failed to update role')
    }

    return response.json()
}

/**
 * Delete a role (SUPERADMIN only)
 */
export const deleteRole = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/rbac/roles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to delete role')
    }
}

/**
 * Get all modules with their actions (for permission matrix)
 */
export const getAllModules = async (): Promise<ModulePermission[]> => {
    const response = await fetch(`${API_URL}/api/rbac/modules`, {
        method: 'GET',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to fetch modules')
    }

    return response.json()
}

/**
 * Get simple modules list (for plan configuration)
 */
export const getModulesList = async (): Promise<any[]> => {
    const response = await fetch(`${API_URL}/api/rbac/modules-list`, {
        method: 'GET',
        headers: getAuthHeaders()
    })

    if (!response.ok) {
        throw new Error('Failed to fetch modules list')
    }

    return response.json()
}

// ========================
// Utility functions
// ========================

/**
 * Check if user has permission (from cached permissions)
 */
export const hasPermission = (permissions: string[], module: string, action: string): boolean => {
    return permissions.includes(`${module}.${action}`)
}

/**
 * Check if user has any permission for a module
 */
export const hasModuleAccess = (permissions: string[], module: string): boolean => {
    return permissions.some(p => p.startsWith(`${module}.`))
}

/**
 * Check if user has a specific role
 */
export const hasRole = (roles: string[], role: string): boolean => {
    return roles.includes(role)
}

/**
 * Check if user is admin (SUPERADMIN or ADMIN)
 */
export const isAdmin = (roles: string[]): boolean => {
    return roles.includes('SUPERADMIN') || roles.includes('ADMIN')
}

/**
 * Check if user is SUPERADMIN
 */
export const isSuperAdmin = (roles: string[]): boolean => {
    return roles.includes('SUPERADMIN')
}

// Default export for convenience
export const rbacService = {
    getMenu,
    getMyPermissions,
    checkPermission,
    getAllRoles,
    getRoleById,
    getRoleByCode,
    createRole,
    updateRole,
    deleteRole,
    getAllModules,
    getModulesList,
    hasPermission,
    hasModuleAccess,
    hasRole,
    isAdmin,
    isSuperAdmin
}

export default rbacService
