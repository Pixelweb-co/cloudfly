'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import ChatbotTypeList from '@/views/administracion/chatbot-types/list'

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

const ChatbotTypeListApp = () => {
    const [chatbotTypeData, setChatbotTypeData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)

        try {
            const res = await axiosInstance.get('/chatbot-types')
            setChatbotTypeData(res.data)
        } catch (error: any) {
            console.warn('Error fetching Chatbot Types data, using mock:', error)
            setChatbotTypeData(getMockData())
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

    return <ChatbotTypeList chatbotTypeData={chatbotTypeData} reload={() => setReload(true)} />
}

export default ChatbotTypeListApp
