'use client'

import { useState } from 'react'
import { Box, Grid, Typography, CircularProgress, Alert, Paper } from '@mui/material'
import { useContactList } from '@/hooks/useContactList'
import ContactCard from './ContactCard'
import ChatWindow from './ChatWindow'
import type { MessagePlatform, ContactCard as ContactCardType } from '@/types/apps/chatTypes'

interface Props {
    platform: MessagePlatform
}

export default function KanbanBoard({ platform }: Props) {
    const { contacts, loading, error, updateContactStage } = useContactList(platform)
    const [selectedContact, setSelectedContact] = useState<ContactCardType | null>(null)

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error) {
        return (
            <Alert severity="error">
                Error al cargar contactos: {error}
            </Alert>
        )
    }

    const columns = [
        { key: 'LEAD', title: 'Leads', color: '#ff9800' },
        { key: 'POTENTIAL', title: 'Clientes Potenciales', color: '#2196f3' },
        { key: 'CLIENT', title: 'Clientes', color: '#4caf50' }
    ]

    const handleCardClick = (contact: ContactCardType) => {
        setSelectedContact(contact)
    }

    const handleDragStart = (e: React.DragEvent, contact: ContactCardType) => {
        e.dataTransfer.setData('contactId', contact.contactId.toString())
        e.dataTransfer.setData('currentStage', contact.stage)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = async (e: React.DragEvent, newStage: 'LEAD' | 'POTENTIAL' | 'CLIENT') => {
        e.preventDefault()
        const contactId = parseInt(e.dataTransfer.getData('contactId'))
        const currentStage = e.dataTransfer.getData('currentStage')

        if (currentStage !== newStage) {
            await updateContactStage(contactId, newStage)
        }
    }

    return (
        <>
            <Grid container spacing={3}>
                {columns.map(column => (
                    <Grid item xs={12} md={4} key={column.key}>
                        <Paper
                            elevation={0}
                            sx={{
                                border: `2px solid ${column.color}`,
                                borderRadius: 2,
                                minHeight: '60vh',
                                bgcolor: 'background.paper'
                            }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.key as any)}
                        >
                            {/* Header de columna */}
                            <Box
                                sx={{
                                    bgcolor: column.color,
                                    color: 'white',
                                    p: 2,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <Typography variant="h6" fontWeight="bold">
                                    {column.title}
                                </Typography>
                                <Typography variant="body2">
                                    {contacts.groups[column.key as keyof typeof contacts.groups]?.length || 0}
                                </Typography>
                            </Box>

                            {/* Cards de contactos */}
                            <Box sx={{ p: 2 }}>
                                {contacts.groups[column.key as keyof typeof contacts.groups]?.map(contact => (
                                    <Box
                                        key={contact.contactId}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, contact)}
                                        sx={{
                                            cursor: 'grab',
                                            '&:active': { cursor: 'grabbing' }
                                        }}
                                    >
                                        <ContactCard
                                            contact={contact}
                                            onClick={() => handleCardClick(contact)}
                                        />
                                    </Box>
                                ))}

                                {(!contacts.groups[column.key as keyof typeof contacts.groups] ||
                                    contacts.groups[column.key as keyof typeof contacts.groups].length === 0) && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ textAlign: 'center', py: 4 }}
                                        >
                                            No hay contactos en esta etapa
                                        </Typography>
                                    )}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Chat Window */}
            {selectedContact && (
                <ChatWindow
                    contact={selectedContact}
                    open={!!selectedContact}
                    onClose={() => setSelectedContact(null)}
                />
            )}
        </>
    )
}
