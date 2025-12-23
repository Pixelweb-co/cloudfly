import axiosInstance from '@/utils/axiosInterceptor'

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
     * Obtiene el menú completo del sistema
     */
    async getMenu(): Promise<MenuItem[]> {
        const response = await axiosInstance.get('/api/menu')
        return response.data
    }
}
