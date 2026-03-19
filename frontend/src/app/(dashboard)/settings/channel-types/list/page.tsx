'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import ChannelTypeList from '@views/apps/settings/channel-types/list'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const ChannelTypeListApp = () => {
    const [channelTypeData, setChannelTypeData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reload, setReload] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        try {
            const token = localStorage.getItem('AuthToken')

            const channel_types_url = `${API_BASE_URL}/api/channel-types`

            const res = await axiosInstance.get(channel_types_url, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })

            setLoading(false)
            setChannelTypeData(res.data)

            return res.data
        } catch (error) {
            console.error('Error fetching Channel Types data:', error)
            setLoading(false)
            throw error
        }
    }

    useEffect(() => {
        fetchData()
        setReload(false)
    }, [reload])

    if (loading) return <LinearProgress color='info' />

    if (error) return window.location.href = '/login'

    return <ChannelTypeList tableData={channelTypeData} reload={() => setReload(true)} />
}

export default ChannelTypeListApp
