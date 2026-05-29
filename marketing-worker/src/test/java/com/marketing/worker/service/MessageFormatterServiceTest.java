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

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MessageFormatterServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private MessageFormatterService messageFormatterService;

    @Test
    void formatMessage_withProductDetails() {
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

        String result = messageFormatterService.formatMessage(campaign, contact).block();

        assertNotNull(result);
        assertTrue(result.contains("Hello John Doe, check this out!"));
        assertTrue(result.contains("*Test Product*"));
        assertTrue(result.contains("A great product"));
        assertTrue(result.contains("💰 Precio: $90"));
        assertTrue(result.contains("SKU: TEST-SKU"));
        assertFalse(result.contains("Chatea con nosotros"));
    }

    @Test
    void formatMessage_withoutProductDetails() {
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

        String result = messageFormatterService.formatMessage(campaign, contact).block();

        assertNotNull(result);
        assertTrue(result.contains("Hi Jane Doe!"));
        assertFalse(result.contains("Chatea con nosotros"));
    }

    @Test
    void formatMessage_withProductIdButProductNotFound() {
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

        String result = messageFormatterService.formatMessage(campaign, contact).block();

        assertNotNull(result);
        assertTrue(result.contains("Hello Bob Smith!"));
        assertFalse(result.contains("Chatea con nosotros"));
    }

    @Test
    void descriptionForWhatsApp_cutsAtInternalNoteMarker() {
        String full = "Ideal para pymes.\n\nNota interna del sistema: prompt del agente IA.";
        assert MessageFormatterService.descriptionForWhatsApp(full).equals("Ideal para pymes.");
        assert MessageFormatterService.descriptionForWhatsApp("Solo público").equals("Solo público");
        assert MessageFormatterService.descriptionForWhatsApp(null).isEmpty();
    }

    @Test
    void formatMessage_withProductDescription_stripsInternalNote() {
        Long contactId = 200L;
        Long productId = 201L;

        ContactEntity contact = ContactEntity.builder()
                .id(contactId)
                .name("Ana")
                .build();

        CampaignEntity campaign = CampaignEntity.builder()
                .id(10L)
                .message("Hola {{nombre}}")
                .productId(productId)
                .build();

        Product product = Product.builder()
                .id(productId)
                .productName("Plan Pro")
                .description("Beneficios para tu equipo.\n\nNota interna del sistema: no enviar esto.")
                .price(new BigDecimal("50"))
                .build();

        when(productRepository.findById(productId)).thenReturn(Mono.just(product));

        String result = messageFormatterService.formatMessage(campaign, contact).block();

        assertNotNull(result);
        assertTrue(result.contains("Beneficios para tu equipo."));
        assertFalse(result.contains("Nota interna del sistema"));
        assertFalse(result.contains("no enviar esto"));
        assertFalse(result.contains("Chatea con nosotros"));
    }
}
