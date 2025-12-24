'use client'

import { useState, useEffect, useCallback } from 'react'
import { axiosInstance } from '@/utils/axiosInstance'
import { useSocket } from '@/contexts/SocketContext'
import type { ContactGroup, ContactCard, MessagePlatform } from '@/types/apps/chatTypes'

export const useContactList = (platform: MessagePlatform) => {
    const { subscribePlatform } = useSocket()
    const [contacts, setContacts] = useState<ContactGroup>({
        groups: {
            LEAD: [],
            POTENTIAL: [],
            CLIENT: []
        }
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadContacts = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await axiosInstance.get(`/api/chat/contacts/${platform}`)
            setContacts(response.data)

        } catch (err: any) {
            console.error('Error loading contacts:', err)
            setError(err.message || 'Error al cargar contactos')
        } finally {
            setLoading(false)
        }
    }, [platform])

    // Suscribirse a actualizaciones de la plataforma
    useEffect(() => {
        subscribePlatform(platform)
        loadContacts()
    }, [platform, subscribePlatform, loadContacts])

    // Actualizar stage de contacto (drag & drop)
    const updateContactStage = async (contactId: number, newStage: 'LEAD' | 'POTENTIAL' | 'CLIENT') => {
        try {
            await axiosInstance.patch(`/api/chat/contacts/${contactId}/stage`, {
                stage: newStage
            })

            // Actualizar localmente
            setContacts(prev => {
                const newGroups = { ...prev.groups }
                let movedContact: ContactCard | null = null

                // Encontrar y remover el contacto de su stage actual
                for (const stage of Object.keys(newGroups) as Array<keyof typeof newGroups>) {
                    const index = newGroups[stage].findIndex(c => c.contactId === contactId)
                    if (index !== -1) {
                        movedContact = { ...newGroups[stage][index], stage: newStage }
                        newGroups[stage] = newGroups[stage].filter((_, i) => i !== index)
                        break
                    }
                }

                // Agregar al nuevo stage
                if (movedContact) {
                    newGroups[newStage] = [...newGroups[newStage], movedContact]
                }

                return { groups: newGroups }
            })

        } catch (err: any) {
            console.error('Error updating contact stage:', err)
            // Recargar en caso de error
            loadContacts()
        }
    }

    return {
        contacts,
        loading,
        error,
        refreshContacts: loadContacts,
        updateContactStage
    }
}
