'use client'

import { SocketProvider } from '@/contexts/SocketContext'
import ConversationsView from '@/views/apps/comunicaciones/conversaciones'

export default function ConversationsPage() {
    return (
        <SocketProvider>
            <ConversationsView />
        </SocketProvider>
    )
}
