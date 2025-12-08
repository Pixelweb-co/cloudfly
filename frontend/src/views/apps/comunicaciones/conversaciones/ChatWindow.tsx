'use client'

import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Avatar,
    Divider,
    Paper
} from '@mui/material'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import type { ContactCard } from '@/types/apps/chatTypes'

interface Props {
    contact: ContactCard
    open: boolean
    onClose: () => void
}

export default function ChatWindow({ contact, open, onClose }: Props) {
    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 450, md: 500 },
                    bgcolor: 'background.default'
                }
            }}
        >
            {/* Header */}
            <Paper
                elevation={2}
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderRadius: 0,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    bgcolor: 'background.paper'
                }}
            >
                <IconButton onClick={onClose} edge="start">
                    <i className="tabler-x" />
                </IconButton>

                <Avatar src={contact.avatarUrl} sx={{ width: 40, height: 40 }}>
                    {contact.name.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {contact.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {contact.externalId}
                    </Typography>
                </Box>

                <IconButton size="small">
                    <i className="tabler-dots-vertical" />
                </IconButton>
            </Paper>

            <Divider />

            {/* Messages Area */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 140px)',
                    overflow: 'hidden'
                }}
            >
                <MessageList conversationId={contact.conversationId} />
            </Box>

            <Divider />

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                <MessageInput conversationId={contact.conversationId} />
            </Box>
        </Drawer>
    )
}
