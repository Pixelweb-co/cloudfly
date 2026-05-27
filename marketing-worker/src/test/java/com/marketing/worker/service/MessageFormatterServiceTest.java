package com.marketing.worker.service;

import com.marketing.worker.persistence.entity.CampaignEntity;
import com.marketing.worker.persistence.entity.ContactEntity;
import com.marketing.worker.persistence.entity.Product;
import com.marketing.worker.persistence.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageFormatterServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private MessageFormatterService messageFormatterService;

    @Test
    void formatMessage_withProductDetails_includesChatLink() {
        // Arrange
        Long contactId = 123L;
        Long productId = 456L;

        ContactEntity contact = ContactEntity.builder()
                .id(contactId)
                .name("John Doe")
                .email("john@example.com")
                .phone("1234567890")
                .build();

        CampaignEntity campaign = CampaignEntity.builder()
                .id(1L)
                .message("Hello {{nombre}}, check this out!")
                .productId(productId)
                .build();

        Product product = Product.builder()
                .id(productId)
                .productName("Test Product")
                .description("A great product")
                .price(new BigDecimal("100"))
                .salePrice(new BigDecimal("90"))
                .sku("TEST-SKU")
                .build();

        when(productRepository.findById(productId)).thenReturn(Mono.just(product));

        // Act
        StepVerifier.create(messageFormatterService.formatMessage(campaign, contact))
                .assertNext(result -> {
                    assert result.contains("Hello John Doe, check this out!");
                    assert result.contains("--- 📦 Detalle del Producto ---");
                    assert result.contains("*Test Product*");
                    assert result.contains("A great product");
                    assert result.contains("💰 Precio: $90");
                    assert result.contains("SKU: TEST-SKU");
                    assert result.contains("💬 Chatea con nosotros: https://dashboard.cloudfly.com.co/contacts/" + contactId);
                })
                .verifyComplete();
    }

    @Test
    void formatMessage_withoutProductDetails_includesChatLink() {
        // Arrange
        Long contactId = 456L;

        ContactEntity contact = ContactEntity.builder()
                .id(contactId)
                .name("Jane Doe")
                .email("jane@example.com")
                .phone("0987654321")
                .build();

        CampaignEntity campaign = CampaignEntity.builder()
                .id(2L)
                .message("Hi {{nombre}}!")
                .productId(null)
                .build();

        // Act
        StepVerifier.create(messageFormatterService.formatMessage(campaign, contact))
                .assertNext(result -> {
                    assert result.contains("Hi Jane Doe!");
                    assert result.contains("💬 Chatea con nosotros: https://dashboard.cloudfly.com.co/contacts/" + contactId);
                    assert !result.contains("--- 📦 Detalle del Producto ---");
                })
                .verifyComplete();
    }

    @Test
    void formatMessage_withProductIdButProductNotFound_includesChatLink() {
        // Arrange
        Long contactId = 789L;
        Long productId = 999L;

        ContactEntity contact = ContactEntity.builder()
                .id(contactId)
                .name("Bob Smith")
                .email("bob@example.com")
                .phone("5555555555")
                .build();

        CampaignEntity campaign = CampaignEntity.builder()
                .id(3L)
                .message("Hello {{nombre}}!")
                .productId(productId)
                .build();

        when(productRepository.findById(productId)).thenReturn(Mono.empty());

        // Act
        StepVerifier.create(messageFormatterService.formatMessage(campaign, contact))
                .assertNext(result -> {
                    assert result.contains("Hello Bob Smith!");
                    assert result.contains("💬 Chatea con nosotros: https://dashboard.cloudfly.com.co/contacts/" + contactId);
                    assert !result.contains("--- 📦 Detalle del Producto ---");
                })
                .verifyComplete();
    }

    @Test
    void formatMessage_withNullContactId_includesChatLinkWithNull() {
        // Arrange
        ContactEntity contact = ContactEntity.builder()
                .id(null)
                .name("Null ID")
                .email("null@example.com")
                .phone("1111111111")
                .build();

        CampaignEntity campaign = CampaignEntity.builder()
                .id(4L)
                .message("Hello {{nombre}}!")
                .productId(null)
                .build();

        // Act
        StepVerifier.create(messageFormatterService.formatMessage(campaign, contact))
                .assertNext(result -> {
                    assert result.contains("Hello Null ID!");
                    // If ID is null, the link should still be appended but with "null" in URL or handled gracefully.
                    // Current implementation appends "null" if ID is null.
                    assert result.contains("💬 Chatea con nosotros: https://dashboard.cloudfly.com.co/contacts/null");
                })
                .verifyComplete();
    }
}
