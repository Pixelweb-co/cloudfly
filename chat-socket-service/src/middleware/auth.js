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
        
        // LOG TEMPORAL PARA DEPURECION
        logger.info(`🔍 [AUTH] Decoded JWT payload: ${JSON.stringify(decoded)}`);

        // Adjuntar información del usuario al socket
        socket.userId = decoded.userId || decoded.id || decoded.sub;
        socket.tenantId = decoded.customer_id;
        socket.companyId = decoded.company_id;
        socket.userRoles = decoded.authorities ? decoded.authorities.split(',') : (decoded.roles || []);
        socket.userName = decoded.sub || decoded.username || decoded.email || 'Unknown';

        logger.info(`User authenticated: ${socket.userName} (ID: ${socket.userId}, Tenant: ${socket.tenantId}, Company: ${socket.companyId})`);

        next();
    } catch (error) {
        logger.error(`Authentication error: ${error.message}`);
        next(new Error('Authentication error: Invalid token'));
    }
};

module.exports = authMiddleware;
