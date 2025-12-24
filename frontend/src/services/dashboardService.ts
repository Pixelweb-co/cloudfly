import { axiosInstance } from '@/utils/axiosInstance'

// Types
export interface DashboardModule {
    code: string
    name: string
    icon: string
    hasAccess: boolean
}

export interface DashboardStats {
    totalRevenue: number
    revenueChange: number
    totalOrders: number
    ordersChange: number
    totalCustomers: number
    customersChange: number
    totalProducts: number
    productsChange: number
    totalInvoices?: number
    invoicesChange?: number
    totalEmployees?: number
    employeesChange?: number
    pendingQuotes?: number
    lowStockProducts?: number
    activeConversations?: number
    messagesChange?: number
}

export interface SalesChartData {
    categories: string[]
    series: Array<{
        name: string
        data: number[]
    }>
}

export interface ActivityItem {
    id: number
    type: 'order' | 'invoice' | 'quote' | 'payment' | 'customer' | 'payroll' | 'conversation'
    title: string
    description: string
    timestamp: string
    icon?: string
    user?: string
    amount?: number
}

export interface TopProduct {
    id: number
    name: string
    sku: string
    quantity: number
    revenue: number
    image?: string
}

export interface PayrollSummary {
    totalEmployees: number
    totalPayroll: number
    pendingReceipts: number
    processedPeriods: number
}

export interface AccountingSummary {
    totalAssets: number
    totalLiabilities: number
    totalEquity: number
    currentPeriod: string
}

// Services
export const dashboardService = {
    // Get user's accessible modules
    async getAccessibleModules(): Promise<DashboardModule[]> {
        const response = await axiosInstance.get('/api/rbac/menu')
        return response.data
    },

    // Get dashboard stats based on user's modules
    async getStats(): Promise<DashboardStats> {
        const response = await axiosInstance.get('/dashboard/stats')
        return response.data
    },

    // Get sales chart data
    async getSalesChart(period: string = '7d'): Promise<SalesChartData> {
        const response = await axiosInstance.get(`/dashboard/sales`, {
            params: { period }
        })
        return response.data
    },

    // Get recent activity
    async getRecentActivity(limit: number = 5): Promise<ActivityItem[]> {
        const response = await axiosInstance.get(`/dashboard/activity`, {
            params: { limit }
        })
        return response.data
    },

    // Get top products
    async getTopProducts(period: string = 'week'): Promise<TopProduct[]> {
        const response = await axiosInstance.get(`/dashboard/top-products`, {
            params: { period }
        })
        return response.data
    },

    // TODO: Implement these endpoints in backend first
    // Get payroll summary (only for HR module users)
    // async getPayrollSummary(): Promise<PayrollSummary> {
    //     const response = await axiosInstance.get('/api/hr/payroll/summary')
    //     return response.data
    // },

    // Get accounting summary (only for accounting module users)
    // async getAccountingSummary(): Promise<AccountingSummary> {
    //     const response = await axiosInstance.get('/api/accounting/summary')
    //     return response.data
    // }
}

export default dashboardService
