package com.app.starter1.persistence.services;

import com.app.starter1.dto.InvoiceRequestDTO;
import com.app.starter1.dto.InvoiceResponseDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.ContactRepository;
import com.app.starter1.persistence.repository.InvoiceRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Transactional
    public InvoiceResponseDTO createInvoice(InvoiceRequestDTO request) {
        Invoice invoice = new Invoice();
        invoice.setTenantId(request.getTenantId());
        invoice.setCustomerId(request.getCustomerId());
        invoice.setOrderId(request.getOrderId());
        invoice.setIssueDate(LocalDateTime.now());
        invoice.setDueDate(request.getDueDate());
        invoice.setStatus(request.getStatus() != null ? request.getStatus() : InvoiceStatus.DRAFT);
        invoice.setNotes(request.getNotes());
        invoice.setInvoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        BigDecimal orderSubtotal = BigDecimal.ZERO;

        for (InvoiceRequestDTO.InvoiceItemRequestDTO itemRequest : request.getItems()) {
            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
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

            BigDecimal itemSubtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setSubtotal(itemSubtotal);

            item.setTax(BigDecimal.ZERO);

            BigDecimal itemTotal = itemSubtotal.subtract(item.getDiscount()).add(item.getTax());
            item.setTotal(itemTotal);

            invoice.getItems().add(item);
            orderSubtotal = orderSubtotal.add(itemTotal);
        }

        invoice.setSubtotal(orderSubtotal);
        invoice.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO);
        invoice.setTax(request.getTax() != null ? request.getTax() : BigDecimal.ZERO);

        BigDecimal total = orderSubtotal.subtract(invoice.getDiscount()).add(invoice.getTax());
        invoice.setTotal(total);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        return mapToDTO(savedInvoice);
    }

    public List<InvoiceResponseDTO> getInvoicesByTenant(Long tenantId) {
        return invoiceRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public InvoiceResponseDTO getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    @Transactional
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }

    private InvoiceResponseDTO mapToDTO(Invoice invoice) {
        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setId(invoice.getId());
        dto.setTenantId(invoice.getTenantId());
        dto.setCustomerId(invoice.getCustomerId());

        if (invoice.getCustomerId() != null) {
            contactRepository.findById(invoice.getCustomerId())
                    .ifPresent(c -> dto.setCustomerName(c.getName()));
        }

        dto.setOrderId(invoice.getOrderId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        dto.setIssueDate(invoice.getIssueDate());
        dto.setDueDate(invoice.getDueDate());
        dto.setStatus(invoice.getStatus());
        dto.setSubtotal(invoice.getSubtotal());
        dto.setTax(invoice.getTax());
        dto.setDiscount(invoice.getDiscount());
        dto.setTotal(invoice.getTotal());
        dto.setNotes(invoice.getNotes());
        dto.setCreatedBy(invoice.getCreatedBy());

        List<InvoiceResponseDTO.InvoiceItemResponseDTO> items = invoice.getItems().stream().map(item -> {
            InvoiceResponseDTO.InvoiceItemResponseDTO itemDTO = new InvoiceResponseDTO.InvoiceItemResponseDTO();
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
