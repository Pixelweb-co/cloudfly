const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * Middleware para validar secret key de n8n
 */
const validateN8nSecret = (req, res, next) => {
    const secret = req.headers['x-api-secret'];

    if (secret !== process.env.N8N_SECRET_KEY) {
        logger.warn(`Unauthorized notification attempt from IP: ${req.ip}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

/**
 * POST /api/notify/new-message
 * Endpoint llamado por n8n cuando llega un mensaje nuevo
 */
router.post('/new-message', validateN8nSecret, async (req, res) => {
    try {
        const {
            messageId,
            conversationId,
            tenantId,
            platform,
            direction,
            externalSenderId,
            externalMessageId,
            body,
            messageType,
            displayName,
            sentAt,
            contactId,
            mediaUrl
        } = req.body;

        // Validación básica
        if (!messageId || !conversationId || !tenantId) {
            logger.warn('Invalid notification data received');
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['messageId', 'conversationId', 'tenantId']
            });
        }

        const io = req.app.get('io');

        // Construir room name para la conversación específica
        const conversationRoom = `tenant_${tenantId}_conv_${conversationId}`;

        // Construir mensaje formateado
        const message = {
            id: messageId,
            conversationId,
            tenantId,
            platform,
            direction,
            externalSenderId,
            externalMessageId,
            body,
            messageType: messageType || 'TEXT',
            displayName,
            sentAt: sentAt ? new Date(sentAt * 1000).toISOString() : new Date().toISOString(),
            contactId,
            mediaUrl,
            createdAt: new Date().toISOString(),
            status: 'DELIVERED'
        };

        // Emitir evento a todos los sockets en esa conversación
        io.to(conversationRoom).emit('new-message', message);

        logger.info(`Message ${messageId} broadcasted to room: ${conversationRoom}`);

        // También emitir evento para actualizar el card del contacto en el Kanban
        const platformRoom = `tenant_${tenantId}_platform_${platform}`;
        io.to(platformRoom).emit('contact-update', {
            contactId,
            conversationId,
            lastMessage: body || '[Media]',
            lastMessageTime: message.sentAt,
            hasUnread: true
        });

        logger.info(`Contact update broadcasted to platform room: ${platformRoom}`);

        res.status(200).json({
            success: true,
            room: conversationRoom,
            messageId: messageId
        });

    } catch (error) {
        logger.error(`Error processing notification: ${error.message}`, { error });
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * POST /api/notify/message-status
 * Endpoint para actualizaciones de estado (delivered, read)
 */
router.post('/message-status', validateN8nSecret, async (req, res) => {
    try {
        const { messageId, conversationId, tenantId, status } = req.body;

        if (!messageId || !status) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const io = req.app.get('io');
        const conversationRoom = `tenant_${tenantId}_conv_${conversationId}`;

        io.to(conversationRoom).emit('message-status-update', {
            messageId,
            status,
            timestamp: new Date().toISOString()
        });

        logger.info(`Message ${messageId} status updated to: ${status}`);

        res.status(200).json({ success: true });

    } catch (error) {
        logger.error(`Error updating message status: ${error.message}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
