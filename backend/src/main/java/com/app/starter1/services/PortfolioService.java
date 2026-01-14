package com.app.starter1.services;

import com.app.starter1.dto.PortfolioDocumentDTO;
import com.app.starter1.dto.PortfolioPaymentRequestDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final PortfolioDocumentRepository documentRepository;
    private final PortfolioPaymentRepository paymentRepository;
    private final PortfolioApplicationRepository applicationRepository;

    private final ContactRepository contactRepository;
    // private final InvoiceRepository invoiceRepository;

    // private final AccountingIntegrationService accountingService; // Integración
    // Contable

    /**
     * Crea un documento de cartera (CxC) a partir de una Factura de Venta
     */
    @Transactional
    public void createReceivableFromInvoice(Invoice invoice) {
        log.info("Creating portfolio document for Invoice ID: {}", invoice.getId());

        // 1. Validar si ya existe
        Optional<PortfolioDocument> existing = documentRepository.findByTenantIdAndDocumentSourceAndDocumentNumber(
                invoice.getTenantId(), "INVOICE", invoice.getInvoiceNumber());

        if (existing.isPresent()) {
            log.warn("Portfolio document already exists for Invoice {}", invoice.getInvoiceNumber());
            return;
        }

        // 2. Buscar Cliente (Contact)
        // Nota: Asumimos que CustomerId de Factura mapea a ContactId o necesitamos
        // buscar el Contact adecuado
        Contact contact = contactRepository.findById(invoice.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Contact/Customer found for Invoice"));

        // 3. Crear Documento
        PortfolioDocument document = PortfolioDocument.builder()
                .tenantId(invoice.getTenantId())
                .contact(contact)
                .type(PortfolioDocumentType.RECEIVABLE)
                .documentSource("INVOICE")
                .documentNumber(invoice.getInvoiceNumber())
                .status(PortfolioStatus.OPEN)
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate() != null ? invoice.getDueDate() : invoice.getIssueDate()) // Default due
                                                                                                       // date
                .totalAmount(invoice.getTotal())
                .balance(invoice.getTotal()) // Inicialmente todo es deuda
                .invoice(invoice)
                .notes("Generado automáticamente desde Facturación")
                .build();

        documentRepository.save(document);
        log.info("Portfolio Document created with ID: {}", document.getId());
    }

    /**
     * Registra un nuevo recaudo o pago
     */
    @Transactional
    public PortfolioPayment registerPayment(PortfolioPaymentRequestDTO request) {
        log.info("Registering payment from Contact ID: {}", request.getContactId());

        Contact contact = contactRepository.findById(request.getContactId())
                .orElseThrow(() -> new RuntimeException("Contact not found"));

        // 1. Crear Pago Encabezado
        PortfolioPayment payment = PortfolioPayment.builder()
                .tenantId(request.getTenantId())
                .contact(contact)
                .type(request.getType() != null ? request.getType() : PortfolioPaymentType.INCOMING)
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDateTime.now())
                .amount(request.getAmount())
                .unappliedAmount(request.getAmount()) // Inicialmente todo está sin aplicar
                .paymentMethod(request.getPaymentMethod())
                .reference(request.getReference())
                .notes(request.getNotes())
                .status("POSTED") // Asumimos directo a Posted por ahora
                .build();

        PortfolioPayment savedPayment = paymentRepository.save(payment);

        // 2. Aplicar Cruces si vienen en el request
        if (request.getApplications() != null && !request.getApplications().isEmpty()) {
            for (PortfolioPaymentRequestDTO.ApplicationRequest appReq : request.getApplications()) {
                applyPaymentToDocument(savedPayment, appReq.getDocumentId(), appReq.getAmount());
            }
        }

        // 3. Integración Contable (Asiento de Caja)
        try {
            // Ejemplo: accountingService.createReceiptVoucher(savedPayment);
            // TODO: Implementar este método en AccountingIntegrationService si no existe
        } catch (Exception e) {
            log.error("Error creating accounting voucher for payment", e);
        }

        return savedPayment;
    }

    /**
     * Aplica un monto de un pago a un documento específico (Cruce)
     */
    @Transactional
    public void applyPaymentToDocument(PortfolioPayment payment, Long documentId, BigDecimal amountToApply) {
        PortfolioDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        // Validaciones Básicas
        if (payment.getUnappliedAmount().compareTo(amountToApply) < 0) {
            throw new RuntimeException("Insufficient unapplied amount in payment");
        }
        if (document.getBalance().compareTo(amountToApply) < 0) {
            throw new RuntimeException("Amount exceeds document balance (Overtip?)"); // Se podría permitir como
                                                                                      // anticipo/saldo a favor, pero
                                                                                      // por ahora estricto
        }

        // 1. Crear Registro de Aplicación
        PortfolioApplication application = PortfolioApplication.builder()
                .tenantId(payment.getTenantId())
                .payment(payment)
                .document(document)
                .amount(amountToApply)
                .build();
        applicationRepository.save(application);

        // 2. Actualizar Saldos
        payment.setUnappliedAmount(payment.getUnappliedAmount().subtract(amountToApply));
        paymentRepository.save(payment);

        document.setBalance(document.getBalance().subtract(amountToApply));

        // 3. Actualizar Estado Documento
        if (document.getBalance().compareTo(BigDecimal.ZERO) == 0) {
            document.setStatus(PortfolioStatus.PAID);
        } else {
            document.setStatus(PortfolioStatus.PARTIAL);
        }
        documentRepository.save(document);
    }

    /**
     * Obtiene lista de deudas pendientes
     */
    public List<PortfolioDocumentDTO> getOpenReceivables(Long tenantId, Long contactId) {
        List<PortfolioStatus> openStatuses = Arrays.asList(PortfolioStatus.OPEN, PortfolioStatus.PARTIAL,
                PortfolioStatus.OVERDUE);

        List<PortfolioDocument> docs;
        if (contactId != null) {
            docs = documentRepository.findByTenantIdAndContactIdAndStatusIn(tenantId, contactId, openStatuses);
        } else {
            // TODO: Esto debería filtrar en repo mejor
            docs = documentRepository.findByTenantId(tenantId).stream()
                    .filter(d -> openStatuses.contains(d.getStatus())
                            && d.getType() == PortfolioDocumentType.RECEIVABLE)
                    .collect(Collectors.toList());
        }

        return docs.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    // Métodos de Reporte Simplificados
    public BigDecimal getTotalReceivables(Long tenantId) {
        return documentRepository.getTotalReceivable(tenantId);
    }

    private PortfolioDocumentDTO mapToDTO(PortfolioDocument doc) {
        return PortfolioDocumentDTO.builder()
                .id(doc.getId())
                .tenantId(doc.getTenantId())
                .contactId(doc.getContact().getId())
                .contactName(doc.getContact().getName()) // O BusinessName
                .type(doc.getType())
                .documentSource(doc.getDocumentSource())
                .status(doc.getStatus())
                .documentNumber(doc.getDocumentNumber())
                .issueDate(doc.getIssueDate())
                .dueDate(doc.getDueDate())
                .totalAmount(doc.getTotalAmount())
                .balance(doc.getBalance())
                .invoiceId(doc.getInvoice() != null ? doc.getInvoice().getId() : null)
                .notes(doc.getNotes())
                .build();
    }
}
