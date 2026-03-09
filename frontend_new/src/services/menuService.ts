'use client'

import { axiosInstance } from '@/utils/axiosInstance'

export interface MenuSuffix {
    label: string
    color: string
}

export interface MenuItem {
    label: string
    icon?: string
    href?: string
    suffix?: MenuSuffix
    excludedRoles?: string[]
    children?: MenuItem[]
}

export const menuService = {
    /**
     * Obtiene el menú completo del sistema desde /api/rbac/menu
     */
    async getMenu(): Promise<MenuItem[]> {
        const response = await axiosInstance.get('/api/rbac/menu')
        return response.data
    }
}
