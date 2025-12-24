import { useState, useEffect } from 'react'
import { axiosInstance } from '@/utils/axiosInstance'

// La API /api/rbac/menu devuelve un array de MenuItems
interface MenuItem {
    id: string
    title: string
    path?: string
    icon?: string
    children?: MenuItem[]
    moduleCode?: string
}

interface UsePermissionsReturn {
    permissions: string[]
    modules: string[]
    roles: string[]
    menu: MenuItem[]
    loading: boolean
    error: Error | null
    hasModule: (moduleCode: string) => boolean
    hasPermission: (permission: string) => boolean
    hasAnyRole: (...roleCodes: string[]) => boolean
}

export function usePermissions(): UsePermissionsReturn {
    const [menu, setMenu] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                setLoading(true)
                // /api/rbac/menu devuelve un array de MenuItems
                const response = await axiosInstance.get<MenuItem[]>('/api/rbac/menu')
                console.log('Menu response:', response.data)
                setMenu(Array.isArray(response.data) ? response.data : [])
                setError(null)
            } catch (err) {
                setError(err as Error)
                console.error('Error fetching menu:', err)
                setMenu([])
            } finally {
                setLoading(false)
            }
        }

        fetchPermissions()
    }, [])

    // Extraer módulos del menú
    const extractModules = (items: MenuItem[]): string[] => {
        const modules: string[] = []
        const traverse = (menuItems: MenuItem[]) => {
            menuItems.forEach(item => {
                if (item.moduleCode) {
                    modules.push(item.moduleCode)
                }
                if (item.children) {
                    traverse(item.children)
                }
            })
        }
        traverse(items)
        return [...new Set(modules)] // Remove duplicates
    }

    // Extraer roles del JWT del localStorage
    const getRolesFromToken = (): string[] => {
        try {
            const token = localStorage.getItem('jwt')
            if (!token) return []

            // Decodificar el JWT (payload es la parte del medio)
            const payload = JSON.parse(atob(token.split('.')[1]))

            // Extraer roles de authorities
            if (payload.authorities) {
                return payload.authorities
                    .split(',')
                    .filter((auth: string) => auth.startsWith('ROLE_'))
                    .map((auth: string) => auth.replace('ROLE_', ''))
            }
            return []
        } catch (error) {
            console.error('Error parsing token:', error)
            return []
        }
    }

    const modules = extractModules(menu)
    const roles = getRolesFromToken()
    const permissions: string[] = [] // TODO: Extract from token if needed

    const hasModule = (moduleCode: string): boolean => {
        if (!moduleCode) return false
        const upperCode = moduleCode.toUpperCase()
        return modules.some(m => m.toUpperCase() === upperCode)
    }

    const hasPermission = (permission: string): boolean => {
        if (!permission) return false
        return permissions.includes(permission)
    }

    const hasAnyRole = (...roleCodes: string[]): boolean => {
        if (!roleCodes || roleCodes.length === 0) return false
        return roleCodes.some(role =>
            roles.some(userRole =>
                userRole.toUpperCase() === role.toUpperCase()
            )
        )
    }

    return {
        permissions,
        modules,
        roles,
        menu,
        loading,
        error,
        hasModule,
        hasPermission,
        hasAnyRole
    }
}

export default usePermissions
