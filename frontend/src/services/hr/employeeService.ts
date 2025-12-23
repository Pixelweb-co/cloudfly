import axiosInstance from '@/utils/axiosInterceptor'
import { Employee, EmployeeCreate, PageResponse, AvailableUser } from '@/types/hr'

export const employeeService = {
    // Get all employees with pagination
    async getAll(customerId: number, page: number = 0, size: number = 10, activeOnly: boolean = false): Promise<PageResponse<Employee>> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<PageResponse<Employee>>(
            `/api/hr/employees?customerId=${cid}&page=${page}&size=${size}&activeOnly=${activeOnly}`
        )
        return response.data
    },

    // Search employees
    async search(customerId: number, search: string, page: number = 0, size: number = 10): Promise<PageResponse<Employee>> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<PageResponse<Employee>>(
            `/api/hr/employees?customerId=${cid}&search=${encodeURIComponent(search)}&page=${page}&size=${size}`
        )
        return response.data
    },

    // Get employee by ID
    async getById(id: number, customerId: number): Promise<Employee> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<Employee>(`/api/hr/employees/${id}?customerId=${cid}`)
        return response.data
    },

    // Create employee
    async create(employee: EmployeeCreate, customerId: number): Promise<Employee> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.post<Employee>(`/api/hr/employees?customerId=${cid}`, employee)
        return response.data
    },

    // Update employee
    async update(id: number, employee: EmployeeCreate, customerId: number): Promise<Employee> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.put<Employee>(`/api/hr/employees/${id}?customerId=${cid}`, employee)
        return response.data
    },

    // Delete employee
    async delete(id: number, customerId: number): Promise<void> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        await axiosInstance.delete(`/api/hr/employees/${id}?customerId=${cid}`)
    },

    // Toggle employee status
    async toggleStatus(id: number, customerId: number): Promise<void> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        await axiosInstance.patch(`/api/hr/employees/${id}/toggle-status?customerId=${cid}`)
    },

    // Get available users (users without employee assigned)
    async getAvailableUsers(customerId: number): Promise<AvailableUser[]> {
        const cid = typeof customerId === 'object' ? 1 : Number(customerId)
        const response = await axiosInstance.get<AvailableUser[]>(`/api/hr/employees/available-users?customerId=${cid}`)
        return response.data
    },
}
