package com.app.starter1.services;

import com.app.starter1.dto.accounting.VoucherEntryDTO;
import com.app.starter1.dto.accounting.VoucherRequestDTO;
import com.app.starter1.dto.accounting.VoucherResponseDTO;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountingIntegrationService {

    private final AccountingVoucherService voucherService;
    private final InvoiceRepository invoiceRepository;
    private final DocumentoSoporteRepository documentoSoporteRepository;
    private final PayrollReceiptRepository payrollReceiptRepository;
    private final NotaCreditoRepository notaCreditoRepository;
    private final NotaDebitoRepository notaDebitoRepository;

    // Configuración Demo de Cuentas
    private static final String ACC_CLIENTES = "130505";
    private static final String ACC_VENTAS = "413501";
    private static final String ACC_IVA_GENERADO = "240801";

    private static final String ACC_PROVEEDORES = "220505";
    private static final String ACC_GASTO_SERV = "513501";

    private static final String ACC_GASTO_NOMINA = "510501";
    private static final String ACC_SALARIOS_POR_PAGAR = "250501";
    private static final String ACC_DEDUCCIONES_NOMINA = "237005";

    @Transactional
    public void generateVoucherForInvoice(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        if (Boolean.TRUE.equals(invoice.getAccountingGenerated()))
            return;

        log.info("Generating accounting voucher for Invoice {}", invoice.getInvoiceNumber());

        List<VoucherEntryDTO> entries = new ArrayList<>();

        // 1. Debito CXC Clientes
        entries.add(createEntry(ACC_CLIENTES, invoice.getTotal(), BigDecimal.ZERO,
                "CxC Cliente " + invoice.getInvoiceNumber()));

        // 2. Credito Ingreso
        entries.add(createEntry(ACC_VENTAS, BigDecimal.ZERO, invoice.getSubtotal(), "Ingreso Venta"));

        // 3. Credito IVA
        if (invoice.getTax() != null && invoice.getTax().compareTo(BigDecimal.ZERO) > 0) {
            entries.add(createEntry(ACC_IVA_GENERADO, BigDecimal.ZERO, invoice.getTax(), "IVA Generado"));
        }

        // Ajuste por redondeo si hace falta (simple check)
        // ...

        VoucherRequestDTO request = VoucherRequestDTO.builder()
                .tenantId(invoice.getTenantId().intValue())
                .voucherType("INGRESO")
                .date(invoice.getIssueDate().toLocalDate())
                .description("Factura Venta " + invoice.getInvoiceNumber())
                .reference(invoice.getInvoiceNumber())
                .entries(entries)
                .build();

        processVoucher(request, invoice::setAccountingVoucherId, invoice::setAccountingGenerated,
                invoiceRepository::save, invoice);
    }

    @Transactional
    public void generateVoucherForDocumentoSoporte(Long docId) {
        DocumentoSoporte doc = documentoSoporteRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Doc not found"));

        if (Boolean.TRUE.equals(doc.getAccountingGenerated()))
            return;

        List<VoucherEntryDTO> entries = new ArrayList<>();
        // Gasto vs CxP
        entries.add(createEntry(ACC_GASTO_SERV, doc.getSubtotal(), BigDecimal.ZERO, "Gasto Serv/Compra DS"));
        entries.add(createEntry(ACC_PROVEEDORES, BigDecimal.ZERO, doc.getTotal(), "CxP Proveedor DS"));

        VoucherRequestDTO request = VoucherRequestDTO.builder()
                .tenantId(doc.getTenantId().intValue())
                .voucherType("EGRESO")
                .date(doc.getFecha())
                .description("Doc Soporte " + doc.getNumeroDocumento())
                .reference(doc.getNumeroDocumento())
                .entries(entries)
                .build();

        processVoucher(request, doc::setAccountingVoucherId, doc::setAccountingGenerated,
                documentoSoporteRepository::save, doc);
    }

    @Transactional
    public void generateVoucherForPayroll(Long receiptId) {
        PayrollReceipt receipt = payrollReceiptRepository.findById(receiptId)
                .orElseThrow(() -> new RuntimeException("Receipt not found"));

        if (Boolean.TRUE.equals(receipt.getAccountingGenerated()))
            return;

        List<VoucherEntryDTO> entries = new ArrayList<>();
        // Gasto Nomina vs Salarios Por Pagar
        entries.add(createEntry(ACC_GASTO_NOMINA, receipt.getTotalPerceptions(), BigDecimal.ZERO, "Gasto Nómina"));
        entries.add(createEntry(ACC_SALARIOS_POR_PAGAR, BigDecimal.ZERO, receipt.getNetPay(), "Neto a Pagar"));

        if (receipt.getTotalDeductions().compareTo(BigDecimal.ZERO) > 0) {
            entries.add(createEntry(ACC_DEDUCCIONES_NOMINA, BigDecimal.ZERO, receipt.getTotalDeductions(),
                    "Deducciones Nómina"));
        }

        // Obtener tenant del empleado -> customer (Assuming customer mapped to tenant
        // logic somewhere or direct)
        // Fallback tenant 1
        Integer tenantId = 1;

        VoucherRequestDTO request = VoucherRequestDTO.builder()
                .tenantId(tenantId)
                .voucherType("EGRESO")
                .date(receipt.getCalculationDate().toLocalDate())
                .description("Nómina " + receipt.getReceiptNumber())
                .reference(receipt.getReceiptNumber())
                .entries(entries)
                .build();

        processVoucher(request, receipt::setAccountingVoucherId, receipt::setAccountingGenerated,
                payrollReceiptRepository::save, receipt);
    }

    // Helper Genérico
    private VoucherEntryDTO createEntry(String accountCode, BigDecimal debit, BigDecimal credit, String desc) {
        return VoucherEntryDTO.builder()
                .accountCode(accountCode)
                .debitAmount(debit != null ? debit : BigDecimal.ZERO)
                .creditAmount(credit != null ? credit : BigDecimal.ZERO)
                .description(desc)
                .build();
    }

    // Process: Create + Post + Updates Entity
    private <T> void processVoucher(VoucherRequestDTO request, java.util.function.Consumer<Long> setId,
            java.util.function.Consumer<Boolean> setGen, java.util.function.Function<T, T> saver, T entity) {
        try {
            // 1. Crear (Draft)
            VoucherResponseDTO draft = voucherService.createVoucher(request);

            // 2. Postear (Actualiza Libros)
            VoucherResponseDTO posted = voucherService.postVoucher(draft.getId());

            // 3. Actualizar entidad origen
            setId.accept(posted.getId());
            setGen.accept(true);
            saver.apply(entity);

            log.info("Accounting generated successfully. Voucher ID: {}", posted.getId());
        } catch (Exception e) {
            log.error("Failed to generate accounting voucher", e);
            // No relanzamos para no tumbar la transacción principal si no es crítico,
            // pero idealmente debería ser transaccional.
            throw e;
        }
    }

    @Transactional
    public void generateVoucherForNotaCredito(Long noteId) {
        // Implementation for Nota Credito
        com.app.starter1.persistence.entity.NotaCredito note = notaCreditoRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Credit Note not found: " + noteId));

        // if (Boolean.TRUE.equals(note.getAccountingGenerated())) return;

        log.info("Generating accounting voucher for Credit Note {}", note.getNumeroNotaCredito());

        // Reverse logic of Invoice (Example)
        List<VoucherEntryDTO> entries = new ArrayList<>();
        // 1. Debit Sales (Returns)
        entries.add(createEntry(ACC_VENTAS, note.getSubtotal(), BigDecimal.ZERO,
                "Devolución Venta " + note.getNumeroNotaCredito()));

        // 2. Debit VAT (Returns) (Assuming tax handling)
        if (note.getTotalImpuestos() != null && note.getTotalImpuestos().compareTo(BigDecimal.ZERO) > 0) {
            entries.add(createEntry(ACC_IVA_GENERADO, note.getTotalImpuestos(), BigDecimal.ZERO, "Devolución IVA"));
        }

        // 3. Credit Customer (Reduce AR)
        entries.add(createEntry(ACC_CLIENTES, BigDecimal.ZERO, note.getTotal(),
                "Nota Credito Cliente " + note.getNumeroNotaCredito()));

        VoucherRequestDTO request = VoucherRequestDTO.builder()
                .tenantId(note.getTenantId().intValue())
                .voucherType("NOTA")
                .date(note.getFechaEmision())
                .description("Nota Credito " + note.getNumeroNotaCredito())
                .reference(note.getNumeroNotaCredito())
                .entries(entries)
                .build();

        try {
            VoucherResponseDTO draft = voucherService.createVoucher(request);
            voucherService.postVoucher(draft.getId());
            // Update note if possible
            log.info("Credit Note Voucher Generated: {}", draft.getId());
        } catch (Exception e) {
            log.error("Error generating CN voucher", e);
        }
    }

    @Transactional
    public void generateVoucherForNotaDebito(Long noteId) {
        // Implementation for Nota Debito (Debit Note increases debt, similar to
        // Invoice)
        com.app.starter1.persistence.entity.NotaDebito note = notaDebitoRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Debit Note not found: " + noteId));

        // if (Boolean.TRUE.equals(note.getContabilidadGenerada())) return;

        log.info("Generating accounting voucher for Debit Note {}", note.getNumeroNotaDebito());

        List<VoucherEntryDTO> entries = new ArrayList<>();
        // 1. Debit CXC (Increase AR)
        entries.add(createEntry(ACC_CLIENTES, note.getTotal(), BigDecimal.ZERO,
                "Nota dEbito Cliente " + note.getNumeroNotaDebito()));

        // 2. Credit Sales (Income increase)
        entries.add(createEntry(ACC_VENTAS, BigDecimal.ZERO, note.getSubtotal(),
                "Ingreso ND " + note.getNumeroNotaDebito()));

        // 3. Credit VAT (Increase Tax)
        if (note.getTotalImpuestos() != null && note.getTotalImpuestos().compareTo(BigDecimal.ZERO) > 0) {
            entries.add(createEntry(ACC_IVA_GENERADO, BigDecimal.ZERO, note.getTotalImpuestos(), "IVA Generado ND"));
        }

        VoucherRequestDTO request = VoucherRequestDTO.builder()
                .tenantId(note.getTenantId().intValue())
                .voucherType("NOTA")
                .date(note.getFechaEmision())
                .description("Nota Debito " + note.getNumeroNotaDebito())
                .reference(note.getNumeroNotaDebito())
                .entries(entries)
                .build();

        try {
            VoucherResponseDTO draft = voucherService.createVoucher(request);
            voucherService.postVoucher(draft.getId());
            log.info("Debit Note Voucher Generated: {}", draft.getId());
        } catch (Exception e) {
            log.error("Error generating ND voucher", e);
        }
    }
}
