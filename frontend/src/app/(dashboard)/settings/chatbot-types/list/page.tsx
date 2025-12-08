'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import axiosInstance from '@/utils/axiosInterceptor'
import ChatbotTypeList from '@views/apps/settings/chatbot-types/list'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const ChatbotTypeListApp = () => {
    const [chatbotTypeData, setChatbotTypeData] = useState<any[]>([])
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

            const chatbot_types_url = `${API_BASE_URL}/chatbot-types`

            const res = await axiosInstance.get(chatbot_types_url, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })

            setLoading(false)
            setChatbotTypeData(res.data)

            return res.data
        } catch (error) {
            console.error('Error fetching Chatbot Types data:', error)
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

    return <ChatbotTypeList chatbotTypeData={chatbotTypeData} reload={() => setReload(true)} />
}

export default ChatbotTypeListApp
