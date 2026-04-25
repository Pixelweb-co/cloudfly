const { Kafka, logLevel } = require('kafkajs');
const logger = require('../utils/logger');
const chatService = require('./chatService');

let consumer = null;

async function initKafkaConsumer(io) {
    try {
        const brokers = (process.env.KAFKA_BROKER || 'kafka:9092').split(',');

        const kafka = new Kafka({
            clientId: 'chat-socket-consumer',
            brokers,
            logLevel: logLevel.WARN
        });

        consumer = kafka.consumer({ groupId: 'chat-socket-responses' });
        
        await consumer.connect();
        logger.info('✅ [KAFKA-CONSUMER] Connected to Kafka brokers');

        await consumer.subscribe({ topic: 'messages.out', fromBeginning: false });
        logger.info('✅ [KAFKA-CONSUMER] Subscribed to topic: messages.out');

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const payload = JSON.parse(message.value.toString());
                logger.info(`📥 [KAFKA-CONSUMER] Received AI response payload: ${JSON.stringify(payload)}`);

                try {
                    const eventPayload = await chatService.processAiResponse(payload);
                    
                    if (eventPayload && io) {
                        const { tenantId, contact } = eventPayload;
                        const roomName = `tenant_${tenantId}_contact_${contact.phone}`;
                        io.to(roomName).emit('new-message', eventPayload);
                        logger.info(`📡 [KAFKA-CONSUMER] Emitted AI message to socket room: ${roomName}`);
                    }
                } catch (err) {
                    logger.error(`❌ [KAFKA-CONSUMER] Error processing AI response: ${err.message}`);
                }
            },
        });

    } catch (error) {
        logger.error(`❌ [KAFKA-CONSUMER] Failed to init consumer: ${error.message}`);
    }
}

async function disconnectKafkaConsumer() {
    if (consumer) {
        await consumer.disconnect();
        logger.info('🔌 [KAFKA-CONSUMER] Disconnected gracefully');
    }
}

module.exports = { initKafkaConsumer, disconnectKafkaConsumer };
