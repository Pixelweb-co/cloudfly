const evolutionClient = require('../services/evolutionClient');
const chatService = require('../services/chatService');
const logger = require('../utils/logger');

/**
 * Manejador de eventos relacionados con mensajes
 */
class MessageHandler {
    /**
     * Manejar envío de mensaje por parte del usuario (Directo a Evolution API)
     */
    handleSendMessage(socket, io) {
        return async (data) => {
            try {
                const { conversationId, body, messageType = 'TEXT' } = data;
                const tenantId = socket.tenantId;

                logger.info(`User ${socket.userId} sending DIRECT message to: ${conversationId}`);

                // 1. Obtener canal para saber el nombre de la instancia
                const channel = await chatService.getChannelForOutbound(tenantId);
                if (!channel) {
                    return socket.emit('error', { message: 'No active WhatsApp channel found for this tenant' });
                }

                // 2. Obtener contacto para guardado
                const contact = await chatService.getOrCreateContact(tenantId, channel.company_id, conversationId);

                // 3. Enviar a Evolution API directamente
                await evolutionClient.sendMessage(channel.instance_name, conversationId, body);

                // 4. Guardar en BD Cloudfly directamente
                const savedMessage = await chatService.saveOutboundMessage(
                    tenantId,
                    conversationId,
                    contact.id,
                    socket.userId,
                    body,
                    'WHATSAPP'
                );

                // 5. Broadcast a todos los sockets en la room
                const roomName = `tenant_${tenantId}_conv_${conversationId}`;
                
                // Formato esperado por el frontend
                const eventPayload = {
                    message: savedMessage,
                    contact: contact
                };

                io.to(roomName).emit('new-message', eventPayload);
                logger.info(`✅ Message ${savedMessage.id} sent via Evolution and broadcasted to: ${roomName}`);

            } catch (error) {
                logger.error(`❌ Error handling send message: ${error.message}`);
                socket.emit('error', {
                    message: 'Failed to send message',
                    details: error.message
                });
            }
        };
    }

    /**
     * Manejar marcado de mensajes como leídos
     * Nota: En esta fase solo notificamos localmente, 
     * el marcado en Evolution podría delegarse después.
     */
    handleMarkAsRead(socket, io) {
        return async (data) => {
            try {
                const { messageIds, conversationId } = data;
                const roomName = `tenant_${socket.tenantId}_conv_${conversationId}`;
                
                socket.to(roomName).emit('messages-read', {
                    messageIds,
                    readBy: socket.userId,
                    readAt: new Date().toISOString()
                });

                logger.debug(`Messages marked as read in socket room: ${roomName}`);
            } catch (error) {
                logger.error(`Error marking messages as read: ${error.message}`);
            }
        };
    }
}

module.exports = new MessageHandler();
