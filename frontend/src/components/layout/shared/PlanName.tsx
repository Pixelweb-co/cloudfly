'use client'

import { useEffect, useState } from 'react'
import { Typography } from '@mui/material'
import { userMethods } from '@/utils/userMethods'
import { axiosInstance } from '@/utils/axiosInstance'

const PlanName = () => {
    const [planName, setPlanName] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPlanName = async () => {
            try {
                // Obtener userData del localStorage
                const userData = userMethods.getUserLogin()

                if (!userData) {
                    setLoading(false)
                    return
                }

                // Intentar obtener tenantId de diferentes lugares
                const tenantId = userData.userEntity?.customer?.id ||
                    userData.customer?.id

                if (!tenantId) {
                    console.warn('No se encontró tenant ID para obtener el plan')
                    setLoading(false)
                    return
                }

                // Obtener la suscripción activa del tenant
                const response = await axiosInstance.get(
                    `/api/v1/subscriptions/tenant/${tenantId}/active`
                )

                if (response.data && response.data.planName) {
                    setPlanName(response.data.planName)
                }
            } catch (error: any) {
                // No mostrar error si es 401 o 404 (no tiene suscripción)
                if (error.response?.status === 404) {
                    console.log('No se encontró suscripción activa')
                } else if (error.response?.status !== 401) {
                    console.error('Error al obtener el plan:', error)
                }
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
