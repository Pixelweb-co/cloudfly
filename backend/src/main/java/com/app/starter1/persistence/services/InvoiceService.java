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

    @Autowired
    private com.app.starter1.services.AccountingIntegrationService accountingIntegrationService;

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

            // DIAN Integration
            item.setDescripcion(itemRequest.getDescriptionDian() != null ? itemRequest.getDescriptionDian()
                    : item.getProductName());
            item.setUnidadMedidaUNECE(itemRequest.getUnitMeasure() != null ? itemRequest.getUnitMeasure() : "NIU"); // Default
                                                                                                                    // NIU=Unidad
            item.setCodigoProducto(itemRequest.getStandardCode());
            item.setEsGratuito(itemRequest.getIsFree() != null ? itemRequest.getIsFree() : false);

            // Impuestos
            if (itemRequest.getTaxRate() != null) {
                item.setPorcentajeImpuesto(itemRequest.getTaxRate());
                item.setTarifaIVA(itemRequest.getTaxRate().compareTo(BigDecimal.ZERO) == 0 ? "EXENTO"
                        : itemRequest.getTaxRate() + "%");
                item.setTipoImpuesto("IVA"); // Default for now
            } else {
                item.setPorcentajeImpuesto(BigDecimal.ZERO);
                item.setTarifaIVA("0%");
                item.setTipoImpuesto("EXCLUIDO");
            }

            // Cálculos usando métodos de la entidad Item
            item.calcularTodo();

            invoice.getItems().add(item);
            orderSubtotal = orderSubtotal.add(item.getTotal());
        }

        invoice.setSubtotal(orderSubtotal);
        invoice.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO);

        // Sumar impuestos de los items
        BigDecimal totalTax = invoice.getItems().stream()
                .map(i -> i.getTax() != null ? i.getTax() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        invoice.setTax(totalTax);

        // El total ya debería ser la suma de los totales de ítems, pero re-verificamos
        // con descuento global si aplica
        // Por simplicidad en este MVP, asumimos que el total es la suma de items y
        // descuento global afecta subtotal o similar.
        // Dado que orderSubtotal ya tiene impuestos de items, ajustamos:
        // TotalFactura = Suma(TotalItem) - DescuentoGlobal (si aplica a factura)
        // Ojo: Usualmente descuentos globales afectan base. Asumiremos descuento global
        // es pos-impuesto o redistribuido.
        // Para este caso simple:
        BigDecimal total = orderSubtotal.subtract(invoice.getDiscount());
        invoice.setTotal(total);

        invoice.setPaymentMeans(request.getPaymentMeans());
        invoice.setPaymentMethod(request.getPaymentMethod());
        // Inicializar estado DIAN si aplica (podría ser lógica condicional más
        // adelante)
        invoice.setDianStatus("PENDING");

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Generar Contabilidad Automática
        try {
            accountingIntegrationService.generateVoucherForInvoice(savedInvoice.getId());
        } catch (Exception e) {
            // Logear pero no fallar la transacción de factura por ahora, o sí?
            // Mejor no interrumpir la creación, pero dejar log
            System.err.println("Error generating accounting voucher: " + e.getMessage());
            e.printStackTrace();
        }

        return mapToDTO(savedInvoice);
    }

    @Transactional
    public List<InvoiceResponseDTO> getInvoicesByTenant(Long tenantId) {
        return invoiceRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
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

        // Campos DIAN
        dto.setCufe(invoice.getCufe());
        dto.setQrCode(invoice.getQrCode());
        dto.setDianStatus(invoice.getDianStatus());
        dto.setDianResponse(invoice.getDianResponse());
        dto.setPaymentMeans(invoice.getPaymentMeans());
        dto.setPaymentMeans(invoice.getPaymentMeans());
        dto.setPaymentMethod(invoice.getPaymentMethod());

        dto.setAccountingGenerated(invoice.getAccountingGenerated());
        dto.setAccountingVoucherId(invoice.getAccountingVoucherId());

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

            // DIAN Integration
            itemDTO.setDescriptionDian(item.getDescripcion());
            itemDTO.setUnitMeasure(item.getUnidadMedidaUNECE());
            itemDTO.setTaxRate(item.getPorcentajeImpuesto());
            itemDTO.setStandardCode(item.getCodigoProducto());
            itemDTO.setIsFree(item.getEsGratuito());

            return itemDTO;
        }).collect(Collectors.toList());

        dto.setItems(items);
        return dto;
    }
}
