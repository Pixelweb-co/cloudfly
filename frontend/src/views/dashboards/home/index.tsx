'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'

// Component Imports
import WelcomeBanner from './WelcomeBanner'
import StatsCards from './StatsCards'
import SalesChart from './SalesChart'
import RecentActivity from './RecentActivity'
import TopProducts from './TopProducts'
import ActiveConversations from './ActiveConversations'

// Skeleton Imports
import SkeletonStats from '@/components/skeleton/SkeletonStats'
import SkeletonChart from '@/components/skeleton/SkeletonChart'
import SkeletonActivity from '@/components/skeleton/SkeletonActivity'
// import DashboardNotifications from './DashboardNotifications'

// Hook Imports
// import { useDashboardUpdates } from '@/hooks/useDashboardUpdates'

const HomeDashboard = () => {
    const [loading, setLoading] = useState(true)
    // const { isConnected, stats, newActivity } = useDashboardUpdates()

    useEffect(() => {
        // Simular carga inicial
        const timer = setTimeout(() => setLoading(false), 1500)
        return () => clearTimeout(timer)
    }, [])

    // Refrescar cuando hay updates por WebSocket
    useEffect(() => {
        if (stats) {
            console.log('📊 Stats actualizadas vía WebSocket:', stats)
        }
    }, [stats])

    useEffect(() => {
        if (newActivity) {
            console.log('🔔 Nueva actividad:', newActivity)
        }
    }, [newActivity])

    return (
        <Grid container spacing={6}>
            {/* Welcome Banner - Always visible */}
            <Grid item xs={12}>
                <WelcomeBanner />
            </Grid>

            {/* Stats Cards */}
            <Grid item xs={12}>
                {loading ? <SkeletonStats /> : <StatsCards />}
            </Grid>

            {/* Charts and Activity */}
            <Grid item xs={12} md={8}>
                {loading ? <SkeletonChart /> : <SalesChart />}
            </Grid>
            <Grid item xs={12} md={4}>
                {loading ? <SkeletonActivity /> : <RecentActivity />}
            </Grid>

            {/* Bottom Section */}
            <Grid item xs={12} md={6}>
                {loading ? <SkeletonActivity /> : <TopProducts />}
            </Grid>
            <Grid item xs={12} md={6}>
                {loading ? <SkeletonActivity /> : <ActiveConversations />}
            </Grid>
        </Grid>
    )
}

export default HomeDashboard
