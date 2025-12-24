import { axiosInstance } from '@/utils/axiosInstance'

export interface VoucherEntry {
    id?: number
    lineNumber?: number
    accountCode: string
    accountName?: string
    thirdPartyId?: number | null
    thirdPartyName?: string
    costCenterId?: number | null
    costCenterName?: string
    description: string
    debitAmount: number
    creditAmount: number
    baseValue?: number
    taxValue?: number
}

export interface VoucherRequest {
    voucherType: 'INGRESO' | 'EGRESO' | 'NOTA_CONTABLE'
    date: string
    description: string
    reference?: string
    tenantId: number
    entries: VoucherEntry[]
}

export interface VoucherResponse {
    id: number
    voucherType: string
    voucherNumber: string
    date: string
    description: string
    reference?: string
    status: 'DRAFT' | 'POSTED' | 'VOID'
    tenantId: number
    totalDebit: number
    totalCredit: number
    isBalanced: boolean
    fiscalYear?: number
    fiscalPeriod?: number
    createdAt?: string
    postedAt?: string
    entries: VoucherEntry[]
}

export class VoucherService {
    static async getAll(tenantId: number): Promise<VoucherResponse[]> {
        const response = await axiosInstance.get('/accounting/vouchers', {
            params: { tenantId }
        })
        return response.data
    }

    static async getById(id: number): Promise<VoucherResponse> {
        const response = await axiosInstance.get(`/accounting/vouchers/${id}`)
        return response.data
    }

    static async create(voucher: VoucherRequest): Promise<VoucherResponse> {
        const response = await axiosInstance.post('/accounting/vouchers', voucher)
        return response.data
    }

    static async update(id: number, voucher: VoucherRequest): Promise<VoucherResponse> {
        const response = await axiosInstance.put(`/accounting/vouchers/${id}`, voucher)
        return response.data
    }

    static async delete(id: number): Promise<void> {
        await axiosInstance.delete(`/accounting/vouchers/${id}`)
    }

    static async post(id: number): Promise<VoucherResponse> {
        const response = await axiosInstance.post(`/accounting/vouchers/${id}/post`)
        return response.data
    }

    static async void(id: number): Promise<VoucherResponse> {
        const response = await axiosInstance.post(`/accounting/vouchers/${id}/void`)
        return response.data
    }
}
