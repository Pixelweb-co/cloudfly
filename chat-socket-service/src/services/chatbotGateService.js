const db = require('../utils/db');
const { getRedisClient, isRedisAvailable } = require('../utils/redisClient');
const logger = require('../utils/logger');

const CACHE_TTL_SECONDS = 300; // 5 minutes

class ChatbotGateService {
    /**
     * Check if chatbot is enabled for a contact.
     * Uses Redis cache (5 min TTL) → falls back to MySQL.
     * Returns true by default if anything fails (safe fallback).
     */
    async isChatbotEnabled(tenantId, contactId) {
        const cacheKey = `chatbot:${tenantId}:${contactId}`;

        try {
            // 1. Try Redis cache first
            if (isRedisAvailable()) {
                const redis = getRedisClient();
                const cached = await redis.get(cacheKey);
                if (cached !== null) {
                    const enabled = cached === '1';
                    logger.debug(`🤖 [CHATBOT-GATE] Cache HIT for contact ${contactId}: ${enabled}`);
                    return enabled;
                }
            }

            // 2. Cache miss → query DB
            const [rows] = await db.execute(
                'SELECT chatbot_enabled FROM contacts WHERE id = ? AND tenant_id = ? LIMIT 1',
                [contactId, tenantId]
            );

            let enabled = true; // default
            if (rows.length > 0 && rows[0].chatbot_enabled !== null) {
                enabled = rows[0].chatbot_enabled === 1;
            }

            // 3. Store in cache
            if (isRedisAvailable()) {
                const redis = getRedisClient();
                await redis.setex(cacheKey, CACHE_TTL_SECONDS, enabled ? '1' : '0');
                logger.debug(`🤖 [CHATBOT-GATE] Cached contact ${contactId}: ${enabled} (TTL: ${CACHE_TTL_SECONDS}s)`);
            }

            logger.info(`🤖 [CHATBOT-GATE] DB query for contact ${contactId}: chatbot_enabled=${enabled}`);
            return enabled;

        } catch (error) {
            logger.error(`❌ [CHATBOT-GATE] Error checking chatbot status: ${error.message}. Defaulting to true.`);
            return true; // safe default: buffer messages
        }
    }

    /**
     * Invalidate the cache for a contact (called when toggling from the UI).
     */
    async invalidateCache(tenantId, contactId) {
        try {
            if (isRedisAvailable()) {
                const redis = getRedisClient();
                await redis.del(`chatbot:${tenantId}:${contactId}`);
                logger.info(`🤖 [CHATBOT-GATE] Cache invalidated for contact ${contactId}`);
            }
        } catch (error) {
            logger.warn(`⚠️ [CHATBOT-GATE] Failed to invalidate cache: ${error.message}`);
        }
    }
}

module.exports = new ChatbotGateService();
