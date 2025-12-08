const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware de autenticación para Socket.IO
 * Valida el JWT token y extrae userId y tenantId
 */
const authMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            logger.warn('Socket connection attempt without token');
            return next(new Error('Authentication error: No token provided'));
        }

        // BYPASS TEMPORAL PARA DESARROLLO
        if (process.env.NODE_ENV === 'development') {
            logger.warn('⚠️ DEVELOPMENT MODE: Bypassing JWT validation');
            socket.userId = 1;
            socket.tenantId = 1;
            socket.userRoles = ['USER'];
            socket.userName = 'DevUser';
            return next();
        }

        // Verificar el token JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adjuntar información del usuario al socket
        socket.userId = decoded.userId || decoded.id || decoded.sub;
        socket.tenantId = decoded.tenantId || decoded.customer?.id;
        socket.userRoles = decoded.roles || [];
        socket.userName = decoded.username || decoded.email || 'Unknown';

        logger.info(`User authenticated: ${socket.userName} (ID: ${socket.userId}, Tenant: ${socket.tenantId})`);

        next();
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = authMiddleware;
