import { useState, useCallback } from 'react'
import axiosInstance from '@/utils/axiosInterceptor'

interface Plan {
  id: number
  name: string
  description: string
  price: number
  durationDays: number
  isActive: boolean
}

interface SubscriptionResponse {
  id: number
  userId: number
  userName: string
  planId: number
  planName: string
  startDate: string
  endDate: string
  status: string
  isAutoRenew: boolean
}

export const useSubscription = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener planes activos
  const fetchActivePlans = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.get('/api/v1/plans/active')
      setPlans(response.data)
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cargar planes'
      setError(errorMsg)
      console.error('Error fetching plans:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Suscribir usuario a un plan
  const subscribeToPlan = useCallback(
    async (userId: number, planId: number, autoRenew: boolean = false) => {
      try {
        setLoading(true)
        setError(null)
        const response = await axiosInstance.post(`/api/v1/subscriptions/users/${userId}/subscribe`, {
          planId,
          isAutoRenew: autoRenew
        })
        return response.data
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Error al suscribirse'
        setError(errorMsg)
        console.error('Error subscribing to plan:', err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Obtener suscripción activa del usuario
  const getActiveSubscription = useCallback(async (userId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.get(`/api/v1/subscriptions/users/${userId}/active`)
      return response.data
    } catch (err: any) {
      // 404 es esperado si no tiene suscripción
      if (err.response?.status === 404) {
        return null
      }
      const errorMsg = err.response?.data?.message || 'Error al obtener suscripción'
      setError(errorMsg)
      console.error('Error fetching subscription:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Cancelar suscripción
  const cancelSubscription = useCallback(async (subscriptionId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.patch(`/api/v1/subscriptions/${subscriptionId}/cancel`)
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cancelar suscripción'
      setError(errorMsg)
      console.error('Error cancelling subscription:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Renovar suscripción
  const renewSubscription = useCallback(async (subscriptionId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.post(`/api/v1/subscriptions/${subscriptionId}/renew`)
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al renovar suscripción'
      setError(errorMsg)
      console.error('Error renewing subscription:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Cambiar plan
  const changePlan = useCallback(async (subscriptionId: number, newPlanId: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axiosInstance.patch(
        `/api/v1/subscriptions/${subscriptionId}/change-plan/${newPlanId}`
      )
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al cambiar plan'
      setError(errorMsg)
      console.error('Error changing plan:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    plans,
    loading,
    error,
    fetchActivePlans,
    subscribeToPlan,
    getActiveSubscription,
    cancelSubscription,
    renewSubscription,
    changePlan
  }
}
