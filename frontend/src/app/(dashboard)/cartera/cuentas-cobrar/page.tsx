'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import { userMethods } from '@/utils/userMethods'
import { portfolioService } from '@/services/portfolioService'
import ReceivablesList from '@views/apps/cartera/cuentas-cobrar'
import type { PortfolioDocument } from '@/types/portfolio'

const ReceivablesPage = () => {
    const [tableData, setTableData] = useState<PortfolioDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const user = userMethods.getUserLogin()
            if (!user || (!user.customer?.id && (user.roles?.[0]?.role !== 'SUPERADMIN'))) {
                console.error("No user or tenant data found")
                setLoading(false)
                return
            }

            // En este ERP, el customer.id suele ser el tenantId para la mayoría de roles
            const tenantId = user.customer?.id || 1

            const data = await portfolioService.getReceivables(tenantId)
            setTableData(data)
        } catch (error) {
            console.error('Error fetching receivables:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (reload) {
            fetchData()
            setReload(false)
        }
    }, [reload])

    if (loading) return <LinearProgress color='primary' />

    return <ReceivablesList tableData={tableData} reload={() => setReload(true)} />
}

export default ReceivablesPage
