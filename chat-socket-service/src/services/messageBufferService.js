const { getRedisClient, isRedisAvailable } = require('../utils/redisClient');
const { publishToKafka, isKafkaAvailable } = require('./kafkaProducer');
const evolutionClient = require('./evolutionClient');
const logger = require('../utils/logger');

const DEBOUNCE_MS = 3000;              // 3 seconds inactivity window
const BUFFER_EXPIRE_SECONDS = 60;      // Safety: auto-cleanup orphaned buffers
const POLL_INTERVAL_MS = 500;          // Worker check frequency
const DEBOUNCE_ZSET = 'debounce_queue'; // Redis sorted set for timing

let workerInterval = null;

class MessageBufferService {
    /**
     * Buffer a message in Redis with a 3-second debounce timer.
     * Each new message resets the timer.
     */
    async bufferMessage(tenantId, companyId, contactId, conversationId, messageData, extraMeta = {}) {
        if (!isRedisAvailable()) {
            logger.warn('⚠️ [BUFFER] Redis unavailable, message will NOT be buffered or processed by AI');
            return false;
        }

        const redis = getRedisClient();
        const bufferKey = `buffer:${tenantId}:${contactId}:${conversationId}`;

        try {
            const entry = JSON.stringify({
                body: messageData.body,
                messageId: messageData.messageId,
                timestamp: messageData.timestamp || new Date().toISOString()
            });

            // 1. Push message to buffer list
            await redis.rpush(bufferKey, entry);
            
            // 2. Set safety expiration on the list
            await redis.expire(bufferKey, BUFFER_EXPIRE_SECONDS);

            // 3. Update debounce timer (overwrite the score = reset timer)
            const fireAt = Date.now() + DEBOUNCE_MS;
            await redis.zadd(DEBOUNCE_ZSET, fireAt, bufferKey);

            // Store companyId for Kafka payload (metadata key)
            await redis.setex(`meta:${bufferKey}`, BUFFER_EXPIRE_SECONDS, JSON.stringify({ 
                companyId, tenantId, contactId, conversationId,
                instance: extraMeta.instance,
                remoteJid: extraMeta.remoteJid
            }));

            const bufferLen = await redis.llen(bufferKey);
            logger.info(`📦 [BUFFER] Buffered msg for contact ${contactId} | conv=${conversationId.substring(0, 8)}... | queue_size=${bufferLen} | fire_in=${DEBOUNCE_MS}ms`);
            
            return true;
        } catch (error) {
            logger.error(`❌ [BUFFER] Error buffering message: ${error.message}`);
            return false;
        }
    }

    /**
     * Start the debounce worker that polls for expired buffers.
     * Runs every POLL_INTERVAL_MS (500ms). Uses atomic ZPOPMIN-like logic.
     */
    startDebounceWorker() {
        if (workerInterval) {
            logger.warn('⚠️ [DEBOUNCE] Worker already running');
            return;
        }

        logger.info(`⏱️ [DEBOUNCE] Starting worker (poll: ${POLL_INTERVAL_MS}ms, debounce: ${DEBOUNCE_MS}ms)`);

        workerInterval = setInterval(async () => {
            try {
                if (!isRedisAvailable()) return;

                const redis = getRedisClient();
                const now = Date.now();

                // Get all buffer keys whose timers have expired
                const expired = await redis.zrangebyscore(DEBOUNCE_ZSET, 0, now);

                for (const bufferKey of expired) {
                    // Atomic remove — if another instance already took it, skip
                    const removed = await redis.zrem(DEBOUNCE_ZSET, bufferKey);
                    if (removed === 0) continue; // Another worker got it

                    await this._flushBuffer(redis, bufferKey);
                }
            } catch (error) {
                logger.error(`❌ [DEBOUNCE] Worker error: ${error.message}`);
            }
        }, POLL_INTERVAL_MS);
    }

    /**
     * Flush a buffer: concatenate messages, publish to Kafka, clean up Redis.
     */
    async _flushBuffer(redis, bufferKey) {
        try {
            // 1. Get all buffered messages
            const rawMessages = await redis.lrange(bufferKey, 0, -1);
            
            if (!rawMessages || rawMessages.length === 0) {
                await redis.del(bufferKey, `meta:${bufferKey}`);
                logger.debug(`⏱️ [DEBOUNCE] Empty buffer, skipping: ${bufferKey}`);
                return;
            }

            // 2. Get metadata
            const metaRaw = await redis.get(`meta:${bufferKey}`);
            if (!metaRaw) {
                logger.warn(`⚠️ [DEBOUNCE] No metadata for ${bufferKey}, skipping`);
                await redis.del(bufferKey);
                return;
            }

            const meta = JSON.parse(metaRaw);

            // 3. Parse and concatenate messages
            const messages = rawMessages.map(raw => {
                try { return JSON.parse(raw); }
                catch { return { body: raw }; }
            });

            const concatenated = messages.map(m => m.body).filter(Boolean).join('\n');
            const messageCount = messages.length;

            // 4. Clean up Redis BEFORE publishing (prevent re-processing)
            await redis.del(bufferKey, `meta:${bufferKey}`);

            // 5. Publish to Kafka
            if (isKafkaAvailable()) {
                const success = await publishToKafka(
                    meta.tenantId,
                    meta.companyId,
                    meta.contactId,
                    meta.conversationId,
                    concatenated,
                    messageCount
                );

                if (success) {
                    logger.info(`⏱️ [DEBOUNCE] BUFFER FLUSHED: ${messageCount} messages for contact ${meta.contactId} published to Kafka topic "messages.in" ✅`);
                    
                    // 6. ENVIAR DOUBLE CHECK AZUL (Read Receipt)
                    if (meta.instance && meta.remoteJid && meta.instance !== 'facebook') {
                        await evolutionClient.markRead(meta.instance, meta.remoteJid);
                    }
                } else {
                    logger.error(`❌ [DEBOUNCE] Kafka publish failed for ${bufferKey}`);
                }
            } else {
                logger.warn(`⚠️ [DEBOUNCE] Kafka unavailable. Concatenated messages dropped: "${concatenated.substring(0, 100)}..."`);
            }

        } catch (error) {
            logger.error(`❌ [DEBOUNCE] Flush error for ${bufferKey}: ${error.message}`);
        }
    }

    /**
     * Stop the debounce worker (for graceful shutdown).
     */
    stopDebounceWorker() {
        if (workerInterval) {
            clearInterval(workerInterval);
            workerInterval = null;
            logger.info('⏱️ [DEBOUNCE] Worker stopped');
        }
    }
}

module.exports = new MessageBufferService();
