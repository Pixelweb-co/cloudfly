// React Imports
import { useEffect, useState } from 'react'

// Context Imports
import { useSocket } from '@/contexts/SocketContext'

interface DashboardStats {
    sales?: any
    customers?: any
    inventory?: any
    chatbot?: any
}

interface Activity {
    id: string
    type: string
    text: string
    detail?: string
    timestamp: string
    link: string
}

export const useDashboardUpdates = () => {
    const { socket, isConnected, subscribeDashboard, unsubscribeDashboard } = useSocket()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [newActivity, setNewActivity] = useState<Activity | null>(null)

    useEffect(() => {
        if (!socket || !isConnected) return

        // Suscribirse a updates del dashboard
        subscribeDashboard()

        // Escuchar updates de estadísticas
        socket.on('dashboard-stats-update', (data: DashboardStats) => {
            console.log('📊 Stats update recibido:', data)
            setStats(data)
        })

        // Escuchar nueva actividad
        socket.on('dashboard-new-activity', (activity: Activity) => {
            console.log('🔔 Nueva actividad:', activity)
            setNewActivity(activity)
        })

        // Escuchar nueva venta
        socket.on('dashboard-new-sale', (sale: any) => {
            console.log('💰 Nueva venta:', sale)

            // Trigger refetch de stats
            setStats(prev => ({
                ...prev,
                sales: { ...prev?.sales, needsUpdate: true }
            }))
        })

        // Cleanup
        return () => {
            unsubscribeDashboard()
            socket.off('dashboard-stats-update')
            socket.off('dashboard-new-activity')
            socket.off('dashboard-new-sale')
        }
    }, [socket, isConnected, subscribeDashboard, unsubscribeDashboard])

    return {
        isConnected,
        stats,
        newActivity,
        clearActivity: () => setNewActivity(null)
    }
}
