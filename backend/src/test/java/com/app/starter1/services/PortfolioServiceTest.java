package com.app.starter1.services;

import com.app.starter1.dto.PortfolioPaymentRequestDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PortfolioServiceTest {

    @Mock
    private PortfolioDocumentRepository documentRepository;
    @Mock
    private PortfolioPaymentRepository paymentRepository;
    @Mock
    private PortfolioApplicationRepository applicationRepository;
    @Mock
    private ContactRepository contactRepository;

    @InjectMocks
    private PortfolioService portfolioService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createReceivableFromInvoice_ShouldCreateDocument_WhenNotExists() {
        // Arrange
        Invoice invoice = new Invoice();
        invoice.setId(1L);
        invoice.setTenantId(10L);
        invoice.setCustomerId(100L);
        invoice.setInvoiceNumber("FV-001");
        invoice.setIssueDate(LocalDateTime.now());
        invoice.setTotal(new BigDecimal("1000.00"));

        Contact contact = new Contact();
        contact.setId(100L);
        contact.setName("Test Client");

        when(documentRepository.findByTenantIdAndDocumentSourceAndDocumentNumber(10L, "INVOICE", "FV-001"))
                .thenReturn(Optional.empty());
        when(contactRepository.findById(100L)).thenReturn(Optional.of(contact));
        when(documentRepository.save(any(PortfolioDocument.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        portfolioService.createReceivableFromInvoice(invoice);

        // Assert
        verify(documentRepository).save(any(PortfolioDocument.class));
    }

    @Test
    void registerPayment_ShouldCreatePaymentAndApply_WhenApplicationsProvided() {
        // Arrange
        Long tenantId = 10L;
        Long contactId = 100L;
        BigDecimal amount = new BigDecimal("500.00");

        PortfolioPaymentRequestDTO request = new PortfolioPaymentRequestDTO();
        request.setTenantId(tenantId);
        request.setContactId(contactId);
        request.setAmount(amount);

        PortfolioPaymentRequestDTO.ApplicationRequest appReq = new PortfolioPaymentRequestDTO.ApplicationRequest();
        appReq.setDocumentId(5L);
        appReq.setAmount(amount);
        request.setApplications(Collections.singletonList(appReq));

        Contact contact = new Contact();
        contact.setId(contactId);

        when(contactRepository.findById(contactId)).thenReturn(Optional.of(contact));
        when(paymentRepository.save(any(PortfolioPayment.class))).thenAnswer(i -> {
            PortfolioPayment p = (PortfolioPayment) i.getArguments()[0];
            p.setId(99L);
            return p;
        });

        PortfolioDocument doc = new PortfolioDocument();
        doc.setId(5L);
        doc.setBalance(new BigDecimal("1000.00"));
        doc.setTenantId(tenantId);

        when(documentRepository.findById(5L)).thenReturn(Optional.of(doc));
        when(documentRepository.save(any(PortfolioDocument.class))).thenReturn(doc);
        when(applicationRepository.save(any(PortfolioApplication.class))).thenReturn(new PortfolioApplication());

        // Act
        PortfolioPayment result = portfolioService.registerPayment(request);

        // Assert
        assertNotNull(result);
        assertTrue(BigDecimal.ZERO.compareTo(result.getUnappliedAmount()) == 0, "Unapplied amount should be zero");
        verify(paymentRepository, atLeastOnce()).save(any(PortfolioPayment.class));
        verify(applicationRepository).save(any(PortfolioApplication.class));
        verify(documentRepository).save(doc);

        // Check document balance update
        assertTrue(new BigDecimal("500.00").compareTo(doc.getBalance()) == 0, "Balance should be 500.00");
    }
}
