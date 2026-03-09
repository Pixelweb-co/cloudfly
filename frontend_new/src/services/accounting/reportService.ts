// services/accounting/reportService.ts

import { axiosInstance } from '@/utils/axiosInstance'
import type {
    LibroDiarioDTO,
    LibroMayorDTO,
    BalanceGeneralDTO,
    EstadoResultadosDTO,
    VoucherType
} from '@/types/apps/contabilidadTypes'

export class AccountingReportService {
    /**
     * Obtiene el Libro Diario
     */
    static async getLibroDiario(
        tenantId: number,
        fromDate: string,
        toDate: string,
        voucherType?: VoucherType
    ): Promise<LibroDiarioDTO> {
        const params: any = { tenantId, fromDate, toDate }
        if (voucherType) params.voucherType = voucherType

        const response = await axiosInstance.get('/api/accounting/reports/libro-diario', { params })
        return response.data
    }

    /**
     * Obtiene el Libro Mayor para una cuenta
     */
    static async getLibroMayor(
        tenantId: number,
        accountCode: string,
        fromDate: string,
        toDate: string
    ): Promise<LibroMayorDTO> {
        const response = await axiosInstance.get('/api/accounting/reports/libro-mayor', {
            params: { tenantId, accountCode, fromDate, toDate }
        })
        return response.data
    }

    /**
     * Obtiene el Balance General
     */
    static async getBalanceGeneral(tenantId: number, asOfDate: string): Promise<BalanceGeneralDTO> {
        const response = await axiosInstance.get('/api/accounting/reports/balance-general', {
            params: { tenantId, asOfDate }
        })
        return response.data
    }

    /**
     * Obtiene el Balance de Prueba
     */
    static async getBalancePrueba(tenantId: number, asOfDate: string): Promise<any> {
        const response = await axiosInstance.get('/api/accounting/reports/balance-prueba', {
            params: { tenantId, asOfDate }
        })
        return response.data
    }

    /**
     * Obtiene el Estado de Resultados
     */
    static async getEstadoResultados(
        tenantId: number,
        fromDate: string,
        toDate: string
    ): Promise<EstadoResultadosDTO> {
        const response = await axiosInstance.get('/api/accounting/reports/estado-resultados', {
            params: { tenantId, fromDate, toDate }
        })
        return response.data
    }

    /**
     * Exporta a Excel (genérico)
     */
    static async exportToExcel(data: any[], filename: string) {
        const XLSX = await import('xlsx')
        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
        XLSX.writeFile(wb, `${filename}.xlsx`)
    }

    /**
     * Exporta a PDF (requiere jspdf)
     */
    static async exportToPDF(htmlElement: HTMLElement, filename: string) {
        const html2pdf = (await import('html2pdf.js')).default
        html2pdf().from(htmlElement).save(`${filename}.pdf`)
    }
}
