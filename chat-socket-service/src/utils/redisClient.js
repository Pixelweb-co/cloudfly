const Redis = require('ioredis');
const logger = require('./logger');

let redis = null;

function getRedisClient() {
    if (redis && redis.status === 'ready') {
        return redis;
    }

    const host = process.env.REDIS_HOST || 'redis';
    const port = parseInt(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    redis = new Redis({
        host,
        port,
        password,
        retryStrategy(times) {
            const delay = Math.min(times * 200, 5000);
            logger.warn(`🔄 [REDIS] Reconnecting... attempt ${times} (delay: ${delay}ms)`);
            return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: false
    });

    redis.on('connect', () => {
        logger.info(`✅ [REDIS] Connected to ${host}:${port}`);
    });

    redis.on('error', (err) => {
        logger.error(`❌ [REDIS] Connection error: ${err.message}`);
    });

    redis.on('close', () => {
        logger.warn('⚠️ [REDIS] Connection closed');
    });

    return redis;
}

function isRedisAvailable() {
    return redis && redis.status === 'ready';
}

module.exports = { getRedisClient, isRedisAvailable };
