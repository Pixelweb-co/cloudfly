const apiClient = require('../services/apiClient');
const logger = require('../utils/logger');

/**
 * Manejador de eventos relacionados con mensajes
 */
class MessageHandler {
    /**
     * Manejar envío de mensaje por parte del usuario
     */
    handleSendMessage(socket, io) {
        return async (data) => {
            try {
                const { conversationId, body, messageType = 'TEXT', mediaUrl, quotedMessageId, platform } = data;

                logger.info(`User ${socket.userId} sending message to conversation: ${conversationId}`);

                // Validar datos
                if (!conversationId || (!body && !mediaUrl)) {
                    socket.emit('error', { message: 'Invalid message data' });
                    return;
                }

                // Validar que el usuario tenga acceso a esta conversación
                const messageData = {
                    conversationId,
                    tenantId: socket.tenantId,
                    fromUserId: socket.userId,
                    direction: 'OUTBOUND',
                    messageType,
                    body,
                    mediaUrl,
                    platform: platform || 'WHATSAPP',
                    externalQuotedMessageId: quotedMessageId
                };

                // Obtener token del handshake
                const userToken = socket.handshake.auth.token;

                // Enviar a Evolution API y guardar en BD
                const savedMessage = await apiClient.sendToEvolution(
                    conversationId,
                    messageData,
                    userToken
                );

                // Broadcast a todos los sockets en la room
                const roomName = `tenant_${socket.tenantId}_conv_${conversationId}`;
                io.to(roomName).emit('new-message', savedMessage);

                logger.info(`Message ${savedMessage.id} sent and broadcasted to room: ${roomName}`);

            } catch (error) {
                logger.error(`Error handling send message: ${error.message}`);
                socket.emit('error', {
                    message: 'Failed to send message',
                    details: error.message
                });
            }
        };
    }

    /**
     * Manejar marcado de mensajes como leídos
     */
    handleMarkAsRead(socket, io) {
        return async (data) => {
            try {
                const { messageIds, conversationId } = data;

                if (!messageIds || !Array.isArray(messageIds)) {
                    return;
                }

                const userToken = socket.handshake.auth.token;
                await apiClient.markAsRead(messageIds, userToken);

                // Notificar a otros usuarios en la conversación
                const roomName = `tenant_${socket.tenantId}_conv_${conversationId}`;
                socket.to(roomName).emit('messages-read', {
                    messageIds,
                    readBy: socket.userId,
                    readAt: new Date().toISOString()
                });

                logger.debug(`Messages marked as read by user ${socket.userId}`);

            } catch (error) {
                logger.error(`Error marking messages as read: ${error.message}`);
            }
        };
    }
}

module.exports = new MessageHandler();
