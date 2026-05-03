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
                    .map(this::addInvisibleFingerprint);
        }
        
        return Mono.just(addInvisibleFingerprint(formatted));
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
        sb.append("\n\n--- 📦 Detalle del Producto ---");
        sb.append("\n*").append(product.getProductName()).append("*");
        if (product.getDescription() != null && !product.getDescription().isEmpty()) {
            sb.append("\n").append(product.getDescription());
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
}
