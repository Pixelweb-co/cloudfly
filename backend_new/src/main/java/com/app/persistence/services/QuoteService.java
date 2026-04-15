package com.app.persistence.services;

import com.app.dto.QuoteRequestDTO;
import com.app.dto.QuoteResponseDTO;
import com.app.persistence.entity.QuoteEntity;
import com.app.persistence.entity.QuoteItemEntity;
import com.app.persistence.entity.QuoteStatus;
import com.app.persistence.repository.ContactRepository;
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
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final ProductRepository productRepository;
    private final ContactRepository contactRepository;

    @Transactional
    public Mono<QuoteResponseDTO> createQuote(QuoteRequestDTO request) {
        QuoteEntity quote = QuoteEntity.builder()
                .tenantId(request.getTenantId())
                .customerId(request.getCustomerId())
                .quoteDate(LocalDateTime.now())
                .expirationDate(request.getExpirationDate())
                .status(request.getStatus() != null ? request.getStatus() : QuoteStatus.DRAFT)
                .notes(request.getNotes())
                .terms(request.getTerms())
                .quoteNumber("QT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .discount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO)
                .tax(request.getTax() != null ? request.getTax() : BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return quoteRepository.save(quote)
                .flatMap(savedQuote -> {
                    BigDecimal[] orderSubtotal = {BigDecimal.ZERO};
                    
                    return Flux.fromIterable(request.getItems())
                            .flatMap(itemRequest -> {
                                QuoteItemEntity item = QuoteItemEntity.builder()
                                        .quoteId(savedQuote.getId())
                                        .productId(itemRequest.getProductId())
                                        .productName(itemRequest.getProductName())
                                        .quantity(itemRequest.getQuantity())
                                        .unitPrice(itemRequest.getUnitPrice())
                                        .discount(itemRequest.getDiscount() != null ? itemRequest.getDiscount() : BigDecimal.ZERO)
                                        .tax(BigDecimal.ZERO)
                                        .build();

                                // Cálculos por item
                                BigDecimal itemSubtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                                item.setSubtotal(itemSubtotal);
                                BigDecimal itemTotal = itemSubtotal.subtract(item.getDiscount()).add(item.getTax());
                                item.setTotal(itemTotal);
                                
                                orderSubtotal[0] = orderSubtotal[0].add(itemTotal);

                                // Si no viene el nombre, buscarlo
                                if (item.getProductName() == null || item.getProductName().isEmpty()) {
                                    return productRepository.findById(item.getProductId())
                                            .map(p -> {
                                                item.setProductName(p.getProductName());
                                                return item;
                                            })
                                            .defaultIfEmpty(item)
                                            .flatMap(quoteItemRepository::save);
                                }
                                return quoteItemRepository.save(item);
                            })
                            .collectList()
                            .flatMap(items -> {
                                savedQuote.setSubtotal(orderSubtotal[0]);
                                BigDecimal finalTotal = orderSubtotal[0].subtract(savedQuote.getDiscount()).add(savedQuote.getTax());
                                savedQuote.setTotal(finalTotal);
                                return quoteRepository.save(savedQuote)
                                        .flatMap(updatedQuote -> mapToDTO(updatedQuote, items));
                            });
                });
    }

    public Flux<QuoteResponseDTO> listByTenant(Long tenantId) {
        return quoteRepository.findByTenantId(tenantId)
                .flatMap(this::enrichWithItemsAndCustomer);
    }

    public Mono<QuoteResponseDTO> getById(Long id) {
        return quoteRepository.findById(id)
                .flatMap(this::enrichWithItemsAndCustomer);
    }

    @Transactional
    public Mono<Void> deleteQuote(Long id) {
        return quoteItemRepository.deleteByQuoteId(id)
                .then(quoteRepository.deleteById(id));
    }

    private Mono<QuoteResponseDTO> enrichWithItemsAndCustomer(QuoteEntity quote) {
        return quoteItemRepository.findByQuoteId(quote.getId())
                .collectList()
                .flatMap(items -> mapToDTO(quote, items));
    }

    private Mono<QuoteResponseDTO> mapToDTO(QuoteEntity quote, java.util.List<QuoteItemEntity> items) {
        QuoteResponseDTO dto = new QuoteResponseDTO();
        dto.setId(quote.getId());
        dto.setTenantId(quote.getTenantId());
        dto.setCustomerId(quote.getCustomerId());
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
        dto.setCreatedBy(quote.getCreatedBy());

        dto.setItems(items.stream().map(item -> {
            QuoteResponseDTO.QuoteItemResponseDTO itemDTO = new QuoteResponseDTO.QuoteItemResponseDTO();
            itemDTO.setId(item.getId());
            itemDTO.setProductId(item.getProductId());
            itemDTO.setProductName(item.getProductName());
            itemDTO.setQuantity(item.getQuantity());
            itemDTO.setUnitPrice(item.getUnitPrice());
            itemDTO.setDiscount(item.getDiscount());
            itemDTO.setSubtotal(item.getSubtotal());
            itemDTO.setTax(item.getTax());
            itemDTO.setTotal(item.getTotal());
            return itemDTO;
        }).collect(java.util.stream.Collectors.toList()));

        if (quote.getCustomerId() != null) {
            return contactRepository.findById(quote.getCustomerId())
                    .map(contact -> {
                        dto.setCustomerName(contact.getName());
                        return dto;
                    })
                    .defaultIfEmpty(dto);
        }
        
        return Mono.just(dto);
    }
}
