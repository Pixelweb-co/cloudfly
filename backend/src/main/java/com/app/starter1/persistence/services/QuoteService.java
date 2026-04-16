package com.app.starter1.persistence.services;

import com.app.starter1.dto.QuoteRequestDTO;
import com.app.starter1.dto.QuoteResponseDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.ContactRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import com.app.starter1.persistence.repository.QuoteRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class QuoteService {

    @Autowired
    private QuoteRepository quoteRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Transactional
    public QuoteResponseDTO createQuote(QuoteRequestDTO request) {
        Quote quote = new Quote();
        quote.setTenantId(request.getTenantId());
        quote.setCustomerId(request.getCustomerId());
        quote.setQuoteDate(LocalDateTime.now());
        quote.setExpirationDate(request.getExpirationDate());
        quote.setStatus(request.getStatus() != null ? request.getStatus() : QuoteStatus.DRAFT);
        quote.setNotes(request.getNotes());
        quote.setTerms(request.getTerms());
        quote.setQuoteNumber("QT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        updateQuoteData(quote, request);

        Quote savedQuote = quoteRepository.save(quote);
        return mapToDTO(savedQuote);
    }

    @Transactional
    public QuoteResponseDTO updateQuote(Long id, QuoteRequestDTO request) {
        Quote quote = quoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Quote not found"));

        quote.setCustomerId(request.getCustomerId());
        quote.setExpirationDate(request.getExpirationDate());
        quote.setStatus(request.getStatus() != null ? request.getStatus() : quote.getStatus());
        quote.setNotes(request.getNotes());
        quote.setTerms(request.getTerms());
        quote.setUpdatedAt(LocalDateTime.now());

        updateQuoteData(quote, request);

        Quote savedQuote = quoteRepository.save(quote);
        return mapToDTO(savedQuote);
    }

    private void updateQuoteData(Quote quote, QuoteRequestDTO request) {
        quote.getItems().clear();
        BigDecimal orderSubtotal = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (QuoteRequestDTO.QuoteItemRequestDTO itemRequest : request.getItems()) {
                QuoteItem item = new QuoteItem();
                item.setQuote(quote);
                item.setProductId(itemRequest.getProductId());

                if (itemRequest.getProductName() == null || itemRequest.getProductName().isEmpty()) {
                    productRepository.findById(itemRequest.getProductId())
                            .ifPresent(p -> item.setProductName(p.getProductName()));
                } else {
                    item.setProductName(itemRequest.getProductName());
                }

                item.setQuantity(itemRequest.getQuantity());
                item.setUnitPrice(itemRequest.getUnitPrice());
                item.setDiscount(itemRequest.getDiscount() != null ? itemRequest.getDiscount() : BigDecimal.ZERO);
                item.setTax(BigDecimal.ZERO); // Simplificado a 0

                BigDecimal itemSubtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                item.setSubtotal(itemSubtotal);

                BigDecimal itemTotal = itemSubtotal.subtract(item.getDiscount()).add(item.getTax());
                item.setTotal(itemTotal);

                quote.getItems().add(item);
                
                orderSubtotal = orderSubtotal.add(itemSubtotal);
                totalDiscount = totalDiscount.add(item.getDiscount());
                totalTax = totalTax.add(item.getTax());
            }
        }

        quote.setSubtotal(orderSubtotal);
        // Si el request trae un descuento global, lo usamos. Si no, usamos la suma de descuentos de items.
        // En este diseño, asumimos que el descuento enviado es el total a restar del subtotal.
        quote.setDiscount(request.getDiscount() != null ? request.getDiscount() : totalDiscount);
        quote.setTax(request.getTax() != null ? request.getTax() : totalTax);

        BigDecimal finalTotal = orderSubtotal.subtract(quote.getDiscount()).add(quote.getTax());
        quote.setTotal(finalTotal);
    }

    @Transactional
    public List<QuoteResponseDTO> getQuotesByTenant(Long tenantId) {
        return quoteRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuoteResponseDTO getQuoteById(Long id) {
        return quoteRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Quote not found"));
    }

    @Transactional
    public void deleteQuote(Long id) {
        quoteRepository.deleteById(id);
    }

    private QuoteResponseDTO mapToDTO(Quote quote) {
        QuoteResponseDTO dto = new QuoteResponseDTO();
        dto.setId(quote.getId());
        dto.setTenantId(quote.getTenantId());
        dto.setCustomerId(quote.getCustomerId());

        // Enriquecer con nombre del cliente
        if (quote.getCustomerId() != null) {
            contactRepository.findById(quote.getCustomerId())
                    .ifPresent(c -> dto.setCustomerName(c.getName()));
        }

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

        List<QuoteResponseDTO.QuoteItemResponseDTO> items = quote.getItems().stream().map(item -> {
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
        }).collect(Collectors.toList());

        dto.setItems(items);
        return dto;
    }
}
