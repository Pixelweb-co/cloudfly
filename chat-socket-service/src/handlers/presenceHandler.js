const apiClient = require('../services/apiClient');
const logger = require('../utils/logger');

/**
 * Manejador de eventos de presencia (typing, online/offline)
 */
class PresenceHandler {
    /**
     * Manejar indicador de "está escribiendo"
     */
    handleTyping(socket, io) {
        return async (data) => {
            try {
                const { conversationId } = data;

                if (!conversationId) {
                    return;
                }

                // Broadcast a otros usuarios en la conversación
                const roomName = `tenant_${socket.tenantId}_company_${socket.companyId}_conv_${conversationId}`;
                socket.to(roomName).emit('user-typing', {
                    userId: socket.userId,
                    userName: socket.userName,
                    conversationId
                });

                // Opcional: notificar al backend
                const userToken = socket.handshake.auth.token;
                apiClient.updateTypingStatus(conversationId, true, userToken);

                logger.debug(`User ${socket.userId} is typing in conversation: ${conversationId}`);

            } catch (error) {
                logger.error(`Error handling typing indicator: ${error.message}`);
            }
        };
    }

    /**
     * Manejar cuando el usuario deja de escribir
     */
    handleStopTyping(socket, io) {
        return async (data) => {
            try {
                const { conversationId } = data;

                if (!conversationId) {
                    return;
                }

                const roomName = `tenant_${socket.tenantId}_company_${socket.companyId}_conv_${conversationId}`;
                socket.to(roomName).emit('user-stop-typing', {
                    userId: socket.userId,
                    conversationId
                });

                const userToken = socket.handshake.auth.token;
                apiClient.updateTypingStatus(conversationId, false, userToken);

                logger.debug(`User ${socket.userId} stopped typing in conversation: ${conversationId}`);

            } catch (error) {
                logger.error(`Error handling stop typing: ${error.message}`);
            }
        };
    }

    /**
     * Manejar conexión de usuario (online)
     */
    handleUserOnline(socket, io) {
        const tenantRoom = `tenant_${socket.tenantId}_company_${socket.companyId}_presence`;
        socket.join(tenantRoom);

        // Broadcast a otros usuarios del tenant
        socket.to(tenantRoom).emit('user-online', {
            userId: socket.userId,
            userName: socket.userName,
            timestamp: new Date().toISOString()
        });

        logger.info(`User ${socket.userId} is now online`);
    }

    /**
     * Manejar desconexión de usuario (offline)
     */
    handleUserOffline(socket, io) {
        const tenantRoom = `tenant_${socket.tenantId}_company_${socket.companyId}_presence`;

        // Broadcast a otros usuarios del tenant
        socket.to(tenantRoom).emit('user-offline', {
            userId: socket.userId,
            userName: socket.userName,
            timestamp: new Date().toISOString()
        });

        logger.info(`User ${socket.userId} is now offline`);
    }
}

module.exports = new PresenceHandler();
