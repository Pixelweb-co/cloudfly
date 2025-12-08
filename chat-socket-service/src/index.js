const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const logger = require('./utils/logger');
const authMiddleware = require('./middleware/auth');
const messageHandler = require('./handlers/messageHandler');
const presenceHandler = require('./handlers/presenceHandler');
const notifyRouter = require('./routes/notify');

// Crear app Express
const app = express();
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware Express
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Hacer io accesible en las rutas
app.set('io', io);

// Rutas HTTP
app.use('/api/notify', notifyRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'chat-socket-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root
app.get('/', (req, res) => {
    res.json({
        service: 'Cloudfly Chat Socket.IO Service',
        version: '1.0.0',
        status: 'running'
    });
});

// =====================
// SOCKET.IO EVENTS
// =====================

// Middleware de autenticación para Socket.IO
io.use(authMiddleware);

// Manejar conexiones
io.on('connection', (socket) => {
    logger.info(`✅ User connected: ${socket.userName} (ID: ${socket.userId}, Tenant: ${socket.tenantId})`);

    // Manejar presencia (online)
    presenceHandler.handleUserOnline(socket, io);

    // ======================
    // CONVERSATION EVENTS
    // ======================

    /**
     * Unirse a una conversación específica
     */
    socket.on('join-conversation', (data) => {
        try {
            const { conversationId } = data;

            if (!conversationId) {
                socket.emit('error', { message: 'conversationId is required' });
                return;
            }

            const roomName = `tenant_${socket.tenantId}_conv_${conversationId}`;
            socket.join(roomName);

            logger.info(`Socket ${socket.id} joined conversation room: ${roomName}`);

            socket.emit('joined-conversation', {
                conversationId,
                room: roomName
            });

        } catch (error) {
            logger.error(`Error joining conversation: ${error.message}`);
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });

    /**
     * Salir de una conversación
     */
    socket.on('leave-conversation', (data) => {
        try {
            const { conversationId } = data;
            const roomName = `tenant_${socket.tenantId}_conv_${conversationId}`;
            socket.leave(roomName);

            logger.info(`Socket ${socket.id} left conversation room: ${roomName}`);

            socket.emit('left-conversation', { conversationId });

        } catch (error) {
            logger.error(`Error leaving conversation: ${error.message}`);
        }
    });

    /**
     * Suscribirse a actualizaciones de una plataforma (WhatsApp, Facebook, etc.)
     * Para recibir notificaciones de nuevos mensajes en cards del Kanban
     */
    socket.on('subscribe-platform', (platform) => {
        try {
            if (!platform) {
                return;
            }

            const roomName = `tenant_${socket.tenantId}_platform_${platform}`;
            socket.join(roomName);

            logger.info(`Socket ${socket.id} subscribed to platform: ${platform}`);

            socket.emit('subscribed-platform', { platform });

        } catch (error) {
            logger.error(`Error subscribing to platform: ${error.message}`);
        }
    });

    // ======================
    // MESSAGE EVENTS
    // ======================

    /**
     * Enviar mensaje
     */
    socket.on('send-message', messageHandler.handleSendMessage(socket, io));

    /**
     * Marcar mensajes como leídos
     */
    socket.on('mark-as-read', messageHandler.handleMarkAsRead(socket, io));

    // ======================
    // PRESENCE EVENTS
    // ======================

    /**
     * Usuario está escribiendo
     */
    socket.on('typing', presenceHandler.handleTyping(socket, io));

    /**
     * Usuario dejó de escribir
     */
    socket.on('stop-typing', presenceHandler.handleStopTyping(socket, io));

    // ======================
    // DISCONNECT
    // ======================

    socket.on('disconnect', (reason) => {
        logger.info(`❌ User disconnected: ${socket.userName} (Reason: ${reason})`);
        presenceHandler.handleUserOffline(socket, io);
    });

    // ======================
    // ERROR HANDLING
    // ======================

    socket.on('error', (error) => {
        logger.error(`Socket error for user ${socket.userId}: ${error.message}`);
    });
});

// =====================
// GLOBAL ERROR HANDLING
// =====================

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`, { error });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// =====================
// START SERVER
// =====================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    logger.info(` `);
    logger.info(`🚀 ========================================`);
    logger.info(`🚀 Chat Socket.IO Service Started`);
    logger.info(`🚀 ========================================`);
    logger.info(`🚀 Port: ${PORT}`);
    logger.info(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🚀 Frontend URL: ${process.env.FRONTEND_URL}`);
    logger.info(`🚀 Java API URL: ${process.env.JAVA_API_URL}`);
    logger.info(`🚀 ========================================`);
    logger.info(` `);
});

module.exports = { app, server, io };
