'use client'

import { useEffect, useState } from 'react'
import { LinearProgress } from '@mui/material'
import { axiosInstance } from '@/utils/axiosInstance'
import { userMethods } from '@/utils/userMethods'
import ContactsList from '@views/apps/marketing/contacts/list'
import type { ContactType } from '@/types/apps/contactType'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const ContactsListApp = () => {
    const [contactsData, setContactsData] = useState<ContactType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [reload, setReload] = useState(false)

    const fetchData = async () => {
        setLoading(true)

        try {
            const token = localStorage.getItem('AuthToken')
            const user = userMethods.getUserLogin()

            let contacts_url = `${API_BASE_URL}/contacts`

            // Si es ADMIN o USER, obtener solo los contactos de su tenant
            if (user.roles[0].role === 'ADMIN' || user.roles[0].role === 'USER') {
                const id_customer = user.customer.id
                contacts_url = `${API_BASE_URL}/contacts/tenant/${id_customer}`
            } else if (user.roles[0].role === 'SUPERADMIN') {
                // SUPERADMIN podría ver todos, pero por ahora también filtramos por tenant
                const id_customer = user.customer.id
                contacts_url = `${API_BASE_URL}/contacts/tenant/${id_customer}`
            }

            const res = await axiosInstance.get(contacts_url, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            })

            setLoading(false)
            setContactsData(res.data)

            return res.data
        } catch (error) {
            console.error('Error fetching contacts data:', error)
            setLoading(false)
            throw error
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

    if (error) {
        window.location.href = '/login'
        return null
    }

    return <ContactsList contactsData={contactsData} reload={() => setReload(true)} />
}

export default ContactsListApp
