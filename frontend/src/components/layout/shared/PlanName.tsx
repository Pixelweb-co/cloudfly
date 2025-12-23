'use client'

import { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import { userMethods } from '@/utils/userMethods'
import axiosInstance from '@/utils/axiosInterceptor'

const PlanName = () => {
    const [planName, setPlanName] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPlanName = async () => {
            try {
                const loguedUser = userMethods.getUserLogin()

                if (!loguedUser || !loguedUser.customer || !loguedUser.customer.id) {
                    setLoading(false)
                    return
                }

                // Obtener la suscripción activa del cliente
                const response = await axiosInstance.get(
                    `/api/v1/subscriptions/tenant/${loguedUser.customer.id}/active`
                )

                if (response.data && response.data.planName) {
                    setPlanName(response.data.planName)
                }
            } catch (error) {
                console.error('Error al obtener el plan:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPlanName()
    }, [])

    if (loading || !planName) {
        return null
    }

    return (
        <Typography
            variant="body2"
            color="primary"
            fontWeight="600"
            suppressHydrationWarning
        >
            Plan: {planName}
        </Typography>
    )
}

export default PlanName
