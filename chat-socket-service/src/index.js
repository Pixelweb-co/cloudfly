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
const chatService = require('./services/chatService');
app.use('/api/notify', notifyRouter);

app.post('/webhook/evolution', async (req, res) => {
    try {
        const io = app.get('io');
        // Ejecutar en segundo plano para responder rápido a Evolution API
        chatService.processEvolutionWebhook(io, req.body);
        res.status(200).send('OK');
    } catch (error) {
        logger.error(`Error in webhook route: ${error.message}`);
        res.status(500).send('Error');
    }
});

/**
 * Obtener últimos mensajes de un contacto por UUID
 * GET /api/chat/messages/:contactUuid?tenantId=X&limit=10
 */
app.get('/api/chat/messages/:contactUuid', async (req, res) => {
    try {
        const { contactUuid } = req.params;
        const tenantId = req.query.tenantId;
        const limit = parseInt(req.query.limit) || 10;

        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }

        // Primero buscar el ID numérico por el UUID
        const [contacts] = await db.execute('SELECT id FROM contacts WHERE uuid = ? AND tenant_id = ?', [contactUuid, tenantId]);
        if (contacts.length === 0) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const messages = await chatService.getMessageHistory(tenantId, contacts[0].id, limit);
        res.json(messages);
    } catch (error) {
        logger.error(`Error fetching messages: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

/**
 * Obtener contactos con conversaciones activas
 * GET /api/chat/contacts?tenantId=X
 */
app.get('/api/chat/contacts', async (req, res) => {
    try {
        const tenantId = req.query.tenantId;

        if (!tenantId) {
            return res.status(400).json({ error: 'tenantId is required' });
        }

        const contacts = await chatService.getContactsWithMessages(tenantId);
        res.json(contacts);
    } catch (error) {
        logger.error(`Error fetching contacts: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

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
     * Unirse a una conversación específica (por UUID de contacto)
     */
    socket.on('join-conversation', (data) => {
        try {
            const { contactUuid } = data;

            if (!contactUuid) {
                socket.emit('error', { message: 'contactUuid is required' });
                return;
            }

            const roomName = `tenant_${socket.tenantId}_contact_${contactUuid}`;
            socket.join(roomName);

            logger.info(`Socket ${socket.id} joined contact room: ${roomName}`);

            socket.emit('joined-conversation', {
                contactUuid,
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
            const { contactUuid } = data;
            const roomName = `tenant_${socket.tenantId}_contact_${contactUuid}`;
            socket.leave(roomName);

            logger.info(`Socket ${socket.id} left contact room: ${roomName}`);

            socket.emit('left-conversation', { contactUuid });

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
