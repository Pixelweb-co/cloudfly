package com.app.persistence.services;

import com.app.dto.QuoteRequestDTO;
import com.app.dto.QuoteResponseDTO;
import com.app.persistence.entity.OrderEntity;
import com.app.persistence.entity.OrderItemEntity;
import com.app.persistence.entity.OrderStatus;
import com.app.persistence.entity.QuoteEntity;
import com.app.persistence.entity.QuoteItemEntity;
import com.app.persistence.entity.QuoteStatus;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.repository.OrderRepository;
import com.app.persistence.repository.OrderItemRepository;
import com.app.persistence.repository.ProductRepository;
import com.app.persistence.repository.QuoteItemRepository;
import com.app.persistence.repository.QuoteRepository;
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
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final ProductRepository productRepository;
    private final ContactRepository contactRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public Flux<QuoteResponseDTO> listByTenant(Long tenantId, Long companyId) {
        Flux<QuoteEntity> quotes;
        if (companyId != null) {
            quotes = quoteRepository.findAllByTenantIdAndCompanyId(tenantId, companyId);
        } else {
            quotes = quoteRepository.findAllByTenantId(tenantId);
        }
        return quotes.flatMap(this::enrichWithItemsAndCustomer);
    }

    public Mono<QuoteResponseDTO> getById(Long id) {
        return quoteRepository.findById(id)
                .flatMap(this::enrichWithItemsAndCustomer);
    }

    @Transactional
    public Mono<QuoteResponseDTO> createQuote(QuoteRequestDTO request) {
        log.info("🚀 [QUOTE-SERVICE] Creating quote for Tenant: {}, Company: {}", request.getTenantId(),
                request.getCompanyId());

        QuoteEntity quote = QuoteEntity.builder()
                .tenantId(request.getTenantId())
                .companyId(request.getCompanyId())
                .customerId(request.getCustomerId())
                .customerName(request.getCustomerName())
                .quoteDate(LocalDateTime.now())
                .expirationDate(request.getExpirationDate())
                .status(request.getStatus() != null ? request.getStatus() : QuoteStatus.PENDING)
                .notes(request.getNotes())
                .terms(request.getTerms())
                .quoteNumber("QT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .subtotal(request.getSubtotal() != null ? request.getSubtotal() : BigDecimal.ZERO)
                .tax(request.getTax() != null ? request.getTax() : BigDecimal.ZERO)
                .discount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO)
                .total(request.getTotal() != null ? request.getTotal() : BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return quoteRepository.save(quote)
                .flatMap(savedQuote -> {
                    if (request.getItems() == null || request.getItems().isEmpty()) {
                        return Mono.just(savedQuote).flatMap(q -> enrichWithItemsAndCustomer(q));
                    }

                    List<QuoteItemEntity> items = request.getItems().stream()
                            .map(itemReq -> {
                                QuoteItemEntity item = new QuoteItemEntity();
                                item.setQuoteId(savedQuote.getId());
                                item.setProductId(itemReq.getProductId());
                                item.setProductName(itemReq.getProductName());
                                item.setQuantity(itemReq.getQuantity());
                                item.setUnitPrice(itemReq.getUnitPrice());
                                item.setDiscount(
                                        itemReq.getDiscount() != null ? itemReq.getDiscount() : BigDecimal.ZERO);
                                item.setSubtotal(itemReq.getSubtotal());
                                item.setTenantId(savedQuote.getTenantId());
                                return item;
                            }).collect(Collectors.toList());

                    return quoteItemRepository.saveAll(items)
                            .collectList()
                            .then(Mono.just(savedQuote))
                            .flatMap(this::enrichWithItemsAndCustomer);
                });
    }

    @Transactional
    public Mono<QuoteResponseDTO> updateQuote(Long id, QuoteRequestDTO request) {
        return quoteRepository.findById(id)
                .flatMap(existingQuote -> {
                    existingQuote.setCustomerId(request.getCustomerId());
                    existingQuote.setCustomerName(request.getCustomerName());
                    existingQuote.setNotes(request.getNotes());
                    existingQuote.setTerms(request.getTerms());
                    existingQuote.setExpirationDate(request.getExpirationDate());
                    existingQuote.setStatus(request.getStatus());
                    existingQuote.setUpdatedAt(LocalDateTime.now());
                    existingQuote.setSubtotal(request.getSubtotal());
                    existingQuote.setTax(request.getTax());
                    existingQuote.setDiscount(request.getDiscount());
                    existingQuote.setTotal(request.getTotal());

                    return quoteItemRepository.deleteByQuoteId(id)
                            .thenMany(Flux.fromIterable(request.getItems()))
                            .map(itemReq -> {
                                QuoteItemEntity item = new QuoteItemEntity();
                                item.setQuoteId(id);
                                item.setProductId(itemReq.getProductId());
                                item.setProductName(itemReq.getProductName());
                                item.setQuantity(itemReq.getQuantity());
                                item.setUnitPrice(itemReq.getUnitPrice());
                                item.setDiscount(itemReq.getDiscount());
                                item.setSubtotal(itemReq.getSubtotal());
                                item.setTenantId(existingQuote.getTenantId());
                                item.setTax(BigDecimal.ZERO);
                                item.setTotal(itemReq.getSubtotal());
                                return item;
                            })
                            .collectList()
                            .flatMap(newItems -> quoteItemRepository.saveAll(newItems).collectList())
                            .then(quoteRepository.save(existingQuote))
                            .flatMap(this::enrichWithItemsAndCustomer);
                });
    }

    @Transactional
    public Mono<Void> deleteQuote(Long id) {
        return quoteItemRepository.deleteByQuoteId(id)
                .then(quoteRepository.deleteById(id));
    }

    @Transactional
    public Mono<OrderEntity> convertToOrder(Long quoteId) {
        log.info("🚀 [QUOTE-SERVICE] Converting quote {} to order", quoteId);
        return quoteRepository.findById(quoteId)
                .flatMap(quote -> {
                    if (quote.getStatus() == QuoteStatus.ACCEPTED) {
                        return Mono.error(new RuntimeException("Esta cotización ya fue convertida a pedido"));
                    }

                    OrderEntity order = OrderEntity.builder()
                            .tenantId(quote.getTenantId())
                            .companyId(quote.getCompanyId())
                            .customerId(quote.getCustomerId())
                            .customerName(quote.getCustomerName())
                            .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                            .orderDate(LocalDateTime.now())
                            .expirationDate(quote.getExpirationDate())
                            .status(OrderStatus.PROCESANDO)
                            .subtotal(quote.getSubtotal())
                            .tax(quote.getTax())
                            .discount(quote.getDiscount())
                            .total(quote.getTotal())
                            .notes(quote.getNotes())
                            .terms(quote.getTerms())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return orderRepository.save(order)
                            .flatMap(savedOrder -> quoteItemRepository.findByQuoteId(quoteId)
                                    .map(quoteItem -> OrderItemEntity.builder()
                                            .orderId(savedOrder.getId())
                                            .tenantId(quoteItem.getTenantId())
                                            .companyId(quoteItem.getCompanyId())
                                            .productId(quoteItem.getProductId())
                                            .productName(quoteItem.getProductName())
                                            .quantity(quoteItem.getQuantity())
                                            .unitPrice(quoteItem.getUnitPrice())
                                            .discount(quoteItem.getDiscount())
                                            .subtotal(quoteItem.getSubtotal())
                                            .tax(quoteItem.getTax())
                                            .total(quoteItem.getTotal())
                                            .build())
                                    .collectList()
                                    .flatMap(orderItems -> orderItemRepository.saveAll(orderItems).collectList())
                                    .then(Mono.defer(() -> {
                                        quote.setStatus(QuoteStatus.ACCEPTED);
                                        quote.setUpdatedAt(LocalDateTime.now());
                                        return quoteRepository.save(quote);
                                    }))
                                    .thenReturn(savedOrder));
                });
    }

    private Mono<QuoteResponseDTO> enrichWithItemsAndCustomer(QuoteEntity quote) {
        return quoteItemRepository.findByQuoteId(quote.getId())
                .collectList()
                .flatMap(items -> {
                    QuoteResponseDTO dto = mapToDTO(quote);
                    dto.setItems(items.stream().map(this::mapItemToDTO).collect(Collectors.toList()));

                    if (quote.getCustomerId() != null
                            && (quote.getCustomerName() == null || quote.getCustomerName().isEmpty())) {
                        return contactRepository.findById(quote.getCustomerId())
                                .map(contact -> {
                                    dto.setCustomerName(contact.getName());
                                    return dto;
                                })
                                .defaultIfEmpty(dto);
                    }
                    return Mono.just(dto);
                });
    }

    private QuoteResponseDTO mapToDTO(QuoteEntity quote) {
        QuoteResponseDTO dto = new QuoteResponseDTO();
        dto.setId(quote.getId());
        dto.setTenantId(quote.getTenantId());
        dto.setCompanyId(quote.getCompanyId());
        dto.setCustomerId(quote.getCustomerId());
        dto.setCustomerName(quote.getCustomerName());
        dto.setQuoteNumber(quote.getQuoteNumber());
        dto.setQuoteDate(quote.getQuoteDate());
        dto.setExpirationDate(quote.getExpirationDate());
        dto.setStatus(quote.getStatus());
        dto.setSubtotal(quote.getSubtotal());
        dto.setTax(quote.getTax());
        dto.setDiscount(quote.getDiscount());
        dto.setTotal(quote.getTotal());
        dto.setNotes(quote.getNotes());
        dto.setTerms(quote.getTerms());
        return dto;
    }

    private QuoteResponseDTO.QuoteItemResponseDTO mapItemToDTO(QuoteItemEntity item) {
        QuoteResponseDTO.QuoteItemResponseDTO itemDTO = new QuoteResponseDTO.QuoteItemResponseDTO();
        itemDTO.setId(item.getId());
        itemDTO.setProductId(item.getProductId());
        itemDTO.setProductName(item.getProductName());
        itemDTO.setQuantity(item.getQuantity());
        itemDTO.setUnitPrice(item.getUnitPrice());
        itemDTO.setDiscount(item.getDiscount());
        itemDTO.setSubtotal(item.getSubtotal());
        return itemDTO;
    }
}
