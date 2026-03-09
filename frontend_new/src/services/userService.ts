import axiosInstance from '@/utils/axiosInstance'

export interface User {
    id: number
    nombres: string
    apellidos: string
    username: string
    email: string
    role: string // Assuming role name for display
    isEnabled: boolean
    accountNoExpired: boolean
    accountNoLocked: boolean
    credentialNoExpired: boolean
    roles: string[]
}

export interface UserCreateUpdateRequest {
    nombres: string
    apellidos: string
    username: string
    email: string
    password?: string
    role: string
}

const userService = {
    getAllUsers: async () => {
        const response = await axiosInstance.get<User[]>('/api/users')
        return response.data
    },

    getUserById: async (id: number) => {
        const response = await axiosInstance.get<User>(`/api/users/${id}`)
        return response.data
    },

    createUser: async (data: UserCreateUpdateRequest) => {
        const response = await axiosInstance.post<User>('/api/users', data)
        return response.data
    },

    updateUser: async (id: number, data: UserCreateUpdateRequest) => {
        const response = await axiosInstance.put<User>(`/api/users/${id}`, data)
        return response.data
    },

    deleteUser: async (id: number) => {
        await axiosInstance.delete(`/api/users/${id}`)
    }
}

export default userService
