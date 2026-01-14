'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import { userMethods } from '@/utils/userMethods'
import { portfolioService } from '@/services/portfolioService'
import PortfolioDashboard from '@views/apps/cartera/dashboard/PortfolioDashboard'

const DashboardPage = () => {
    const [totalReceivable, setTotalReceivable] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const user = userMethods.getUserLogin()
                if (user?.customer?.id) {
                    const total = await portfolioService.getTotalReceivables(user.customer.id)
                    setTotalReceivable(total)
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <LinearProgress color='primary' />

    return <PortfolioDashboard totalReceivable={totalReceivable} />
}

export default DashboardPage
