const { Kafka, logLevel } = require('kafkajs');
const logger = require('../utils/logger');

let producer = null;
let isConnected = false;

const TOPIC = 'messages.in';

async function initKafkaProducer() {
    try {
        const brokers = (process.env.KAFKA_BROKER || 'kafka:9092').split(',');

        const kafka = new Kafka({
            clientId: 'chat-socket-service',
            brokers,
            logLevel: logLevel.WARN,
            retry: {
                initialRetryTime: 1000,
                retries: 5
            }
        });

        producer = kafka.producer();
        await producer.connect();
        isConnected = true;

        logger.info(`✅ [KAFKA] Producer connected to brokers: ${brokers.join(', ')}`);
        logger.info(`✅ [KAFKA] Target topic: ${TOPIC}`);

        producer.on('producer.disconnect', () => {
            isConnected = false;
            logger.warn('⚠️ [KAFKA] Producer disconnected');
        });

        return producer;
    } catch (error) {
        logger.error(`❌ [KAFKA] Failed to initialize producer: ${error.message}`);
        isConnected = false;
        return null;
    }
}

/**
 * Publish a buffered (concatenated) message to Kafka.
 */
async function publishToKafka(tenantId, companyId, contactId, conversationId, concatenatedMessage, messageCount) {
    if (!isConnected || !producer) {
        logger.error('❌ [KAFKA] Producer not connected. Message dropped.');
        return false;
    }

    const key = `${tenantId}:${contactId}:${conversationId}`;
    const value = {
        tenantId,
        companyId,
        contactId,
        conversationId,
        mensaje: concatenatedMessage,
        messageCount,
        timestamp: new Date().toISOString(),
        source: 'buffered'
    };

    try {
        await producer.send({
            topic: TOPIC,
            messages: [{
                key,
                value: JSON.stringify(value)
            }]
        });

        logger.info(`📤 [KAFKA] Published to ${TOPIC} | key=${key} | msgs=${messageCount} | len=${concatenatedMessage.length} chars`);
        return true;
    } catch (error) {
        logger.error(`❌ [KAFKA] Failed to publish: ${error.message}`);
        return false;
    }
}

async function disconnectKafka() {
    if (producer) {
        await producer.disconnect();
        isConnected = false;
        logger.info('🔌 [KAFKA] Producer disconnected gracefully');
    }
}

function isKafkaAvailable() {
    return isConnected && producer !== null;
}

module.exports = { initKafkaProducer, publishToKafka, disconnectKafka, isKafkaAvailable };
