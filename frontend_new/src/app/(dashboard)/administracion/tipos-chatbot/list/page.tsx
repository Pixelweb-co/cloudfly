'use client'

import { useEffect, useState } from 'react'

import { LinearProgress } from '@mui/material'

import { axiosInstance } from '@/utils/axiosInstance'
import ChannelTypeList from '@/views/administracion/chatbot-types/list'

// Mock data generator for fallback
const getMockData = () => {
    return [
        {
            id: 1,
            typeName: 'SALES',
            description: 'Bot para ventas automatizadas',
            webhookUrl: 'https://n8n.webhook.com/sales',
            status: true
        },
        {
            id: 2,
            typeName: 'SUPPORT',
            description: 'Bot para soporte técnico',
            webhookUrl: 'https://n8n.webhook.com/support',
            status: true
        }
    ]
}

const ChannelTypeListApp = () => {
    const [channelTypeData, setChannelTypeData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)

        try {
            const res = await axiosInstance.get('/api/channel-types')

            setChannelTypeData(res.data)
        } catch (error: any) {
            console.warn('Error fetching Channel Types data, using mock:', error)
            setChannelTypeData(getMockData())
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

    if (loading) return <LinearProgress color='info' />

    return <ChannelTypeList channelTypeData={channelTypeData} reload={() => setReload(true)} />
}

export default ChannelTypeListApp
