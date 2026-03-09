import axiosInstance from '@/utils/axiosInstance'

export interface Role {
    id: number
    code: string
    name: string
    description: string
    isSystem: boolean
    isActive: boolean
    modulePermissions: any[]
}

export interface RoleRequest {
    code: string
    name: string
    description: string
    isSystem: boolean
    isActive: boolean
    modulePermissions: any[]
}

const roleService = {
    getAllRoles: async () => {
        // Endpoint in RbacController
        const response = await axiosInstance.get<Role[]>('/api/rbac/roles')
        return response.data
    },

    getRoleById: async (id: number) => {
        const response = await axiosInstance.get<Role>(`/api/rbac/roles/${id}`)
        return response.data
    },

    createRole: async (data: RoleRequest) => {
        const response = await axiosInstance.post<Role>('/api/rbac/roles', data)
        return response.data
    },

    updateRole: async (id: number, data: RoleRequest) => {
        const response = await axiosInstance.put<Role>(`/api/rbac/roles/${id}`, data)
        return response.data
    },

    deleteRole: async (id: number) => {
        await axiosInstance.delete(`/api/rbac/roles/${id}`)
    }
}

export default roleService
