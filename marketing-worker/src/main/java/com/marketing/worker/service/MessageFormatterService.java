package com.marketing.worker.service;

import com.marketing.worker.persistence.entity.CampaignEntity;
import com.marketing.worker.persistence.entity.ContactEntity;
import com.marketing.worker.persistence.entity.Product;
import com.marketing.worker.persistence.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageFormatterService {

    private final ProductRepository productRepository;

    private static final String DASHBOARD_BASE_URL = "https://dashboard.cloudfly.com.co/contacts/";

    /** Texto a partir de aquí es uso interno (otros servicios); no va a WhatsApp. */
    private static final String INTERNAL_NOTE_MARKER = "nota interna del sistema";

    // Zero-width characters used to make each message unique
    // WhatsApp won't display them but they prevent duplicate detection
    private static final char[] INVISIBLE_CHARS = {
            '\u200B', // zero-width space
            '\u200C', // zero-width non-joiner
            '\u200D', // zero-width joiner
            '\uFEFF'  // zero-width no-break space
    };

    public Mono<String> formatMessage(CampaignEntity campaign, ContactEntity contact) {
        String baseMessage = campaign.getMessage() != null ? campaign.getMessage() : "";
        
        // Personalization
        String formatted = baseMessage
                .replace("{{nombre}}", contact.getName() != null ? contact.getName() : "")
                .replace("{{email}}", contact.getEmail() != null ? contact.getEmail() : "")
                .replace("{{phone}}", contact.getPhone() != null ? contact.getPhone() : "");

        if (campaign.getProductId() != null) {
            return productRepository.findById(campaign.getProductId())
                    .map(product -> appendProductDetails(formatted, product))
                    .defaultIfEmpty(formatted)
                    .map(message -> appendChatLink(message, contact.getId()))
                    .map(this::addInvisibleFingerprint);
        }
        
        return Mono.just(addInvisibleFingerprint(appendChatLink(formatted, contact.getId())));
    }

    private String appendChatLink(String message, Long contactId) {
        if (contactId == null) {
            return message;
        }
        return message + "\n\n💬 Chatea con nosotros: " + DASHBOARD_BASE_URL + contactId;
    }

    /**
     * Appends a random sequence of invisible characters to the end of the message.
     * This ensures no two messages are byte-identical, which helps avoid
     * WhatsApp's duplicate/spam detection.
     */
    private String addInvisibleFingerprint(String message) {
        StringBuilder sb = new StringBuilder(message);
        int len = 3 + ThreadLocalRandom.current().nextInt(5); // 3-7 invisible chars
        for (int i = 0; i < len; i++) {
            sb.append(INVISIBLE_CHARS[ThreadLocalRandom.current().nextInt(INVISIBLE_CHARS.length)]);
        }
        return sb.toString();
    }

    private String appendProductDetails(String message, Product product) {
        StringBuilder sb = new StringBuilder(message);
        sb.append("\n\n*").append(product.getProductName()).append("*");
        String publicDescription = descriptionForWhatsApp(product.getDescription());
        if (!publicDescription.isEmpty()) {
            sb.append("\n").append(publicDescription);
        }
        
        BigDecimal price = product.getSalePrice() != null ? product.getSalePrice() : product.getPrice();
        if (price == null || price.compareTo(BigDecimal.ZERO) == 0) {
            sb.append("\n💰 *¡GRATIS!*");
        } else {
            sb.append("\n💰 Precio: $").append(price);
        }
        
        if (product.getSku() != null) {
            sb.append("\nSKU: ").append(product.getSku());
        }
        
        return sb.toString();
    }

    /**
     * Solo la parte pública de la descripción; corta en "nota interna del sistema" (insensible a mayúsculas).
     */
    static String descriptionForWhatsApp(String description) {
        if (description == null || description.isBlank()) {
            return "";
        }
        String lower = description.toLowerCase();
        String marker = INTERNAL_NOTE_MARKER.toLowerCase();
        int idx = lower.indexOf(marker);
        String trimmed = idx >= 0 ? description.substring(0, idx).strip() : description.strip();
        return trimmed;
    }
}
