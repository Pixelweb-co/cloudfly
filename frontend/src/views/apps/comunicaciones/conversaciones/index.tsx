'use client'

import { useState } from 'react'
import { Card, CardContent, Tabs, Tab, Box, Typography } from '@mui/material'
import { useSocket } from '@/contexts/SocketContext'
import KanbanBoard from './KanbanBoard'
import type { MessagePlatform } from '@/types/apps/chatTypes'

export default function ConversationsView() {
    const [currentTab, setCurrentTab] = useState<MessagePlatform>('WHATSAPP')
    const { isConnected } = useSocket()

    return (
        <div>
            {/* Header con indicador de conexión */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4">Conversaciones</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: isConnected ? 'success.main' : 'error.main'
                        }}
                    />
                    <Typography variant="body2" color="text.secondary">
                        {isConnected ? 'Conectado' : 'Desconectado'}
                    </Typography>
                </Box>
            </Box>

            <Card>
                <Tabs
                    value={currentTab}
                    onChange={(e, val) => setCurrentTab(val)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        label="WhatsApp"
                        value="WHATSAPP"
                        icon={<i className="tabler-brand-whatsapp" />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Facebook"
                        value="FACEBOOK_MESSENGER"
                        icon={<i className="tabler-brand-facebook" />}
                        iconPosition="start"
                    />
                    <Tab
                        label="Instagram"
                        value="INSTAGRAM_DM"
                        icon={<i className="tabler-brand-instagram" />}
                        iconPosition="start"
                    />
                </Tabs>

                <CardContent>
                    <KanbanBoard platform={currentTab} />
                </CardContent>
            </Card>
        </div>
    )
}
