package com.app.persistence.services;

import com.app.dto.InvoiceResponseDTO;
import com.app.dto.TenantPaymentGatewayDTO;
import com.app.persistence.entity.InvoiceEntity;
import com.app.persistence.entity.InvoiceItemEntity;
import com.app.persistence.entity.TenantPaymentGatewayEntity;
import com.app.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ContactRepository contactRepository;
    private final TenantPaymentGatewayRepository gatewayRepository;

    public Flux<InvoiceResponseDTO> listByTenant(Long tenantId, Long companyId) {
        log.info("Listing invoices for tenant: {}, company: {}", tenantId, companyId);
        Flux<InvoiceEntity> invoices = (companyId != null)
                ? invoiceRepository.findAllByTenantId(tenantId).filter(inv -> companyId.equals(inv.getCompanyId()))
                : invoiceRepository.findAllByTenantId(tenantId);

        return invoices.flatMap(this::enrichWithItemsAndCustomer);
    }

    public Mono<InvoiceResponseDTO> getById(Long id) {
        return invoiceRepository.findById(id)
                .flatMap(this::enrichWithItemsAndCustomer);
    }

    public Mono<InvoiceResponseDTO> getByPublicToken(String token) {
        log.info("Fetching public invoice details for token: {}", token);
        return invoiceRepository.findByPublicUrlToken(token)
                .flatMap(this::enrichWithItemsAndCustomer);
    }

    @Transactional
    public Mono<InvoiceResponseDTO> createInvoiceFromOrder(Long orderId, String billingType, String billingPeriod) {
        log.info("Generating invoice from Order ID: {}, type: {}, period: {}", orderId, billingType, billingPeriod);
        return orderRepository.findById(orderId)
                .flatMap(order -> {
                    // Generate unique public URL token
                    String token = "inv_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                    
                    InvoiceEntity invoice = InvoiceEntity.builder()
                            .tenantId(order.getTenantId())
                            .companyId(order.getCompanyId())
                            .customerId(order.getCustomerId())
                            .publicUrlToken(token)
                            .billingType(billingType != null ? billingType : "PAGO_UNICO")
                            .billingPeriod(billingPeriod)
                            .invoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                            .issueDate(LocalDateTime.now())
                            .dueDate(LocalDateTime.now().plusDays(15)) // 15 days payment terms by default
                            .status("PENDING")
                            .subtotal(order.getSubtotal())
                            .tax(order.getTax())
                            .total(order.getTotal())
                            .currency("COP")
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return invoiceRepository.save(invoice)
                            .flatMap(savedInvoice -> {
                                // Clone order items to invoice items
                                return orderItemRepository.findByOrderId(orderId)
                                        .map(orderItem -> InvoiceItemEntity.builder()
                                                .invoiceId(savedInvoice.getId())
                                                .productId(orderItem.getProductId())
                                                .productName(orderItem.getProductName())
                                                .quantity(orderItem.getQuantity())
                                                .unitPrice(orderItem.getUnitPrice())
                                                .discount(orderItem.getDiscount() != null ? orderItem.getDiscount() : BigDecimal.ZERO)
                                                .tax(orderItem.getTax() != null ? orderItem.getTax() : BigDecimal.ZERO)
                                                .total(orderItem.getTotal())
                                                .createdAt(LocalDateTime.now())
                                                .build())
                                        .collectList()
                                        .flatMap(invoiceItems -> invoiceItemRepository.saveAll(invoiceItems).collectList())
                                        .thenReturn(savedInvoice);
                            });
                })
                .flatMap(this::enrichWithItemsAndCustomer);
    }

    // --- GATEWAY CONFIGS ---

    public Mono<TenantPaymentGatewayDTO> getGatewayConfig(Long tenantId, Long companyId, String provider) {
        return gatewayRepository.findByTenantIdAndCompanyIdAndProvider(tenantId, companyId, provider)
                .map(this::mapGatewayToDTO)
                .defaultIfEmpty(new TenantPaymentGatewayDTO());
    }

    public Mono<TenantPaymentGatewayDTO> saveGatewayConfig(TenantPaymentGatewayDTO dto) {
        log.info("Saving gateway configuration for tenant: {}, company: {}, provider: {}", 
                dto.getTenantId(), dto.getCompanyId(), dto.getProvider());
        
        return gatewayRepository.findByTenantIdAndCompanyIdAndProvider(dto.getTenantId(), dto.getCompanyId(), dto.getProvider())
                .flatMap(existing -> {
                    existing.setPublicKey(dto.getPublicKey());
                    existing.setPrivateKeyEncrypted(dto.getPrivateKeyEncrypted());
                    existing.setEventsSecret(dto.getEventsSecret());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return gatewayRepository.save(existing);
                })
                .switchIfEmpty(Mono.defer(() -> {
                    TenantPaymentGatewayEntity gateway = TenantPaymentGatewayEntity.builder()
                            .tenantId(dto.getTenantId())
                            .companyId(dto.getCompanyId())
                            .provider(dto.getProvider() != null ? dto.getProvider() : "WOMPI")
                            .publicKey(dto.getPublicKey())
                            .privateKeyEncrypted(dto.getPrivateKeyEncrypted())
                            .eventsSecret(dto.getEventsSecret())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return gatewayRepository.save(gateway);
                }))
                .map(this::mapGatewayToDTO);
    }

    // --- HELPERS & ENRICHERS ---

    private Mono<InvoiceResponseDTO> enrichWithItemsAndCustomer(InvoiceEntity invoice) {
        return invoiceItemRepository.findAllByInvoiceId(invoice.getId())
                .collectList()
                .flatMap(items -> {
                    InvoiceResponseDTO dto = mapToDTO(invoice);
                    dto.setItems(items.stream().map(this::mapItemToDTO).collect(Collectors.toList()));

                    if (invoice.getCustomerId() != null) {
                        return contactRepository.findById(invoice.getCustomerId())
                                .map(contact -> {
                                    dto.setCustomerName(contact.getName());
                                    return dto;
                                })
                                .defaultIfEmpty(dto);
                    }
                    return Mono.just(dto);
                });
    }

    private InvoiceResponseDTO mapToDTO(InvoiceEntity invoice) {
        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setId(invoice.getId());
        dto.setTenantId(invoice.getTenantId());
        dto.setCompanyId(invoice.getCompanyId());
        dto.setCustomerId(invoice.getCustomerId());
        dto.setSubscriptionId(invoice.getSubscriptionId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        dto.setIssueDate(invoice.getIssueDate());
        dto.setDueDate(invoice.getDueDate());
        dto.setStatus(invoice.getStatus());
        dto.setSubtotal(invoice.getSubtotal());
        dto.setTax(invoice.getTax());
        dto.setTotal(invoice.getTotal());
        dto.setCurrency(invoice.getCurrency());
        dto.setPdfUrl(invoice.getPdfUrl());
        dto.setPublicUrlToken(invoice.getPublicUrlToken());
        dto.setBillingType(invoice.getBillingType());
        dto.setBillingPeriod(invoice.getBillingPeriod());
        dto.setBillingPeriodStart(invoice.getBillingPeriodStart());
        dto.setBillingPeriodEnd(invoice.getBillingPeriodEnd());
        dto.setCreatedAt(invoice.getCreatedAt());
        dto.setUpdatedAt(invoice.getUpdatedAt());
        return dto;
    }

    private InvoiceResponseDTO.InvoiceItemResponseDTO mapItemToDTO(InvoiceItemEntity item) {
        InvoiceResponseDTO.InvoiceItemResponseDTO itemDTO = new InvoiceResponseDTO.InvoiceItemResponseDTO();
        itemDTO.setId(item.getId());
        itemDTO.setProductId(item.getProductId());
        itemDTO.setProductName(item.getProductName());
        itemDTO.setQuantity(item.getQuantity());
        itemDTO.setUnitPrice(item.getUnitPrice());
        itemDTO.setDiscount(item.getDiscount());
        itemDTO.setTax(item.getTax());
        itemDTO.setTotal(item.getTotal());
        return itemDTO;
    }

    private TenantPaymentGatewayDTO mapGatewayToDTO(TenantPaymentGatewayEntity gateway) {
        TenantPaymentGatewayDTO dto = new TenantPaymentGatewayDTO();
        dto.setId(gateway.getId());
        dto.setTenantId(gateway.getTenantId());
        dto.setCompanyId(gateway.getCompanyId());
        dto.setProvider(gateway.getProvider());
        dto.setPublicKey(gateway.getPublicKey());
        dto.setPrivateKeyEncrypted(gateway.getPrivateKeyEncrypted());
        dto.setEventsSecret(gateway.getEventsSecret());
        return dto;
    }
}
