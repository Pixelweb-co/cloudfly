'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { channelService } from '@/services/marketing/channelService'
import type { Channel } from '@/types/marketing'
import ChannelListTable from '@/views/marketing/channels/ChannelListTable'
import { Grid, Typography } from '@mui/material'

const ChannelPage = () => {
    const { data: session } = useSession()
    const [channels, setChannels] = useState<Channel[]>([])
    const [loading, setLoading] = useState(true)

    const fetchChannels = async () => {
        if (!session?.user?.accessToken) return
        try {
            const data = await channelService.getChannels((session.user as any).accessToken)
            setChannels(data)
        } catch (error) {
            console.error('Error fetching channels:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchChannels()
    }, [session])

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4'>Canales de Comunicación</Typography>
                <Typography variant='body2'>Configura tus integraciones con WhatsApp, Meta y más.</Typography>
            </Grid>
            <Grid item xs={12}>
                <ChannelListTable tableData={channels} reload={fetchChannels} />
            </Grid>
        </Grid>
    )
}

export default ChannelPage
