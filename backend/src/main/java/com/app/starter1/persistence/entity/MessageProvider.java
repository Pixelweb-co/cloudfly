package com.app.starter1.persistence.entity;

public enum MessageProvider {
    EVOLUTION, // Evolution API (WhatsApp Business)
    META, // Meta Graph API (Facebook/Instagram)
    TELEGRAM, // Telegram Bot API
    TWILIO, // Twilio
    CUSTOM // Custom webhook
}
