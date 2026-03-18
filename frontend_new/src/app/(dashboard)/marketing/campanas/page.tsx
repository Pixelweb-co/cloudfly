'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { marketingService } from '@/services/marketing/marketingService'
import type { MarketingCampaign } from '@/types/marketing'
import CampaignListTable from '@/views/marketing/campaigns/CampaignListTable'
import { Grid, Typography } from '@mui/material'

const CampaignPage = () => {
    const { data: session } = useSession()
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCampaigns = async () => {
        if (!session?.user?.accessToken) return
        try {
            const data = await marketingService.getCampaigns((session.user as any).accessToken)
            setCampaigns(data)
        } catch (error) {
            console.error('Error fetching campaigns:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCampaigns()
    }, [session])

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4'>Marketing</Typography>
                <Typography variant='body2'>Gestiona tus campañas publicitarias y canales de comunicación.</Typography>
            </Grid>
            <Grid item xs={12}>
                <CampaignListTable tableData={campaigns} reload={fetchCampaigns} />
            </Grid>
        </Grid>
    )
}

export default CampaignPage
