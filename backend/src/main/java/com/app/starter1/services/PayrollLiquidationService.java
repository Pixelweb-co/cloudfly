package com.app.starter1.services;

import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import com.app.starter1.services.PayrollCalculationService.PayrollCalculationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Servicio para liquidar y pagar nóminas
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollLiquidationService {

    private final PayrollPeriodRepository periodRepository;
    private final PayrollReceiptRepository receiptRepository;
    private final PayrollNoveltyRepository noveltyRepository;
    private final CustomerRepository customerRepository;
    // private final NotificationService notificationService;
    private final PayrollNotificationService notificationService;
    private final PayrollCalculationService calculationService;
    private final PayrollAccountingService accountingService;
    private final PayrollPdfService pdfService;

    /**
     * Liquida un período completo, generando recibos para todos los empleados
     */
    @Transactional
    public LiquidationResult liquidatePeriod(Long periodId, Long customerId) {
        log.info("Iniciando liquidación del período {} para cliente {}", periodId, customerId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        PayrollPeriod period = periodRepository.findByIdAndCustomer(periodId, customer)
                .orElseThrow(() -> new RuntimeException("Período no encontrado"));

        if (period.getStatus() != PayrollPeriod.PeriodStatus.OPEN) {
            throw new RuntimeException("Solo se pueden liquidar períodos en estado OPEN");
        }

        List<PayrollReceipt> receipts = new ArrayList<>();
        int employeesProcessed = 0;
        BigDecimal totalNetPay = BigDecimal.ZERO;

        // Obtener novedades pendientes
        List<PayrollNovelty> novelties = noveltyRepository.findByPeriod(customerId, periodId);

        for (Employee employee : period.getAssignedEmployees()) {
            try {
                // 1. Calcular
                PayrollCalculationResult calcResult = calculationService.calculatePayroll(employee, period);

                // 2. Crear Recibo (Entidad)
                PayrollReceipt receipt = createReceiptFromCalculation(period, employee, calcResult);

                // 3. Generar PDF (Simulado para path, el real se genera al enviar)
                String pdfUrl = generateReceiptPDF(receipt);
                receipt.setPdfPath(pdfUrl);

                // Guardar para tener ID y persistencia
                receipt = receiptRepository.save(receipt);
                receipts.add(receipt);

                totalNetPay = totalNetPay.add(receipt.getNetPay());
                employeesProcessed++;

                // 4. Enviar Notificación (Kafka -> Evolution API)
                try {
                    notificationService.sendReceiptByEmail(receipt);
                } catch (Exception e) {
                    log.warn("No se pudo enviar la notificación inmediata para recibo {}: {}",
                            receipt.getReceiptNumber(), e.getMessage());
                }

            } catch (Exception e) {
                log.error("Error procesando empleado {} ({}): {}", employee.getId(), employee.getFullName(),
                        e.getMessage(), e);
            }
        }

        // Marcar novedades como procesadas
        novelties.forEach(n -> n.setStatus(PayrollNovelty.NoveltyStatus.PROCESSED));
        noveltyRepository.saveAll(novelties);

        // Actualizar período
        period.setStatus(PayrollPeriod.PeriodStatus.LIQUIDATED);
        period.setTotalPayroll(totalNetPay);
        period.setProcessedAt(LocalDateTime.now());
        periodRepository.save(period);

        // Generar Contabilidad
        try {
            accountingService.generatePayrollLiquidationVoucher(period, receipts);
        } catch (Exception e) {
            log.error("Error generando contabilidad: {}", e.getMessage());
        }

        log.info("Liquidación completada. Empleados: {}, Total: {}", employeesProcessed, totalNetPay);

        return LiquidationResult.builder()
                .periodId(period.getId())
                .status("LIQUIDATED")
                .receiptsGenerated(employeesProcessed)
                .totalNetPay(totalNetPay)
                .build();
    }

    /**
     * Paga un recibo individual
     */
    @Transactional
    public PaymentResult payReceipt(Long receiptId, PaymentRequest request) {
        log.info("Procesando pago de recibo {} para cliente {}", receiptId, request.getPaymentReference());

        PayrollReceipt receipt = receiptRepository.findById(receiptId)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));

        if (receipt.getStatus() == PayrollReceipt.ReceiptStatus.PAID) {
            throw new RuntimeException("El recibo ya está pagado");
        }

        receipt.setStatus(PayrollReceipt.ReceiptStatus.PAID);
        receipt.setPaidAt(LocalDateTime.now());
        receipt.setPaymentReference(request.getPaymentReference());
        receipt.setNotes(request.getNotes());

        if (request.getPaymentMethod() != null) {
            try {
                receipt.getEmployee().setPaymentMethod(Employee.PaymentMethod.valueOf(request.getPaymentMethod()));
            } catch (Exception e) {
                // Ignore invalid payment method
            }
        }

        receiptRepository.save(receipt);

        // Verificar si todo el período está pagado
        checkAndUpdatePeriodStatus(receipt.getPayrollPeriod());

        // Generar comprobante contable de pago individual (Egreso)
        try {
            // accountingService.generatePaymentVoucher(receipt); // TODO: Implementar en
            // AccountingService
        } catch (Exception e) {
            log.error("Error generando comprobante de egreso: {}", e.getMessage());
        }

        // Reenviar notificación de pago exitoso (opcional)
        try {
            notificationService.sendReceiptByEmail(receipt);
        } catch (Exception e) {
            // ignore
        }

        log.info("Pago procesado exitosamente para recibo {}", receiptId);

        return PaymentResult.builder()
                .receiptId(receipt.getId())
                .employeeName(receipt.getEmployee().getFullName())
                .netPay(receipt.getNetPay())
                .status("PAID")
                .pdfUrl(receipt.getPdfPath())
                .emailSent(true)
                .periodStatus(receipt.getPayrollPeriod().getStatus().name())
                .build();
    }

    /**
     * Crea la entidad PayrollReceipt a partir del resultado del cálculo
     */
    private PayrollReceipt createReceiptFromCalculation(PayrollPeriod period, Employee employee,
            PayrollCalculationResult result) {
        PayrollReceipt receipt = new PayrollReceipt();
        receipt.setPayrollPeriod(period);
        receipt.setEmployee(employee);
        receipt.setReceiptNumber(generateReceiptNumber(period, employee));
        receipt.setCalculationDate(LocalDateTime.now());
        receipt.setStatus(PayrollReceipt.ReceiptStatus.PENDING);

        // Información base
        receipt.setBaseSalary(result.getBaseSalary());
        receipt.setDailySalary(result.getDailySalary());
        receipt.setRegularDays(BigDecimal.valueOf(result.getWorkingDays()));

        // Devengos
        receipt.setSalaryAmount(result.getSalaryAmount());
        receipt.setOvertimeAmount(result.getOvertimeAmount());
        receipt.setCommissionsAmount(result.getCommissionsAmount());
        receipt.setTransportAllowanceAmount(result.getTransportAllowanceAmount());
        receipt.setBonusesAmount(result.getBonusesAmount());
        receipt.setOtherEarnings(result.getOtherEarnings());

        // Deducciones
        receipt.setHealthDeduction(result.getHealthDeduction());
        receipt.setPensionDeduction(result.getPensionDeduction());
        receipt.setOtherDeductions(result.getOtherDeductions());

        // Costos Empleador
        receipt.setEmployerHealthContribution(result.getEmployerHealthContribution());
        receipt.setEmployerPensionContribution(result.getEmployerPensionContribution());
        receipt.setArlContribution(result.getArlContribution());
        receipt.setSenaContribution(result.getSenaContribution());
        receipt.setIcbfContribution(result.getIcbfContribution());
        receipt.setCajaCompensacionContribution(result.getCajaCompensacionContribution());

        // Provisiones
        receipt.setPrimaServiciosProvision(result.getPrimaServiciosProvision());
        receipt.setCesantiasProvision(result.getCesantiasProvision());
        receipt.setInteresesCesantiasProvision(result.getInteresesCesantiasProvision());
        receipt.setVacacionesProvision(result.getVacacionesProvision());

        // Totales Totales
        receipt.setTotalPerceptions(result.getTotalPerceptions());
        receipt.setTotalDeductions(result.getTotalDeductions());
        receipt.setNetPay(result.getNetPay());
        receipt.setTotalEmployerCosts(result.getTotalEmployerCosts());
        receipt.setTotalProvisions(result.getTotalProvisions());

        return receipt;
    }

    private String generateReceiptNumber(PayrollPeriod period, Employee employee) {
        return String.format("REC-%d-%d-%d", period.getYear(), period.getPeriodNumber(), employee.getId());
    }

    private void checkAndUpdatePeriodStatus(PayrollPeriod period) {
        List<PayrollReceipt> receipts = receiptRepository.findByPayrollPeriod(period);

        long paidCount = receipts.stream().filter(PayrollReceipt::isPaid).count();
        long totalCount = receipts.size();

        // Calcular total pagado
        BigDecimal totalPaid = receipts.stream()
                .filter(PayrollReceipt::isPaid)
                .map(PayrollReceipt::getNetPay)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Actualizar elapsedPayroll
        period.setElapsedPayroll(totalPaid);

        if (paidCount == 0) {
            period.setStatus(PayrollPeriod.PeriodStatus.LIQUIDATED);
        } else if (paidCount < totalCount) {
            period.setStatus(PayrollPeriod.PeriodStatus.PARTIALLY_PAID);
        } else {
            period.setStatus(PayrollPeriod.PeriodStatus.PAID);
            period.setPaidAt(LocalDateTime.now());
        }

        periodRepository.save(period);
    }

    private String generateReceiptPDF(PayrollReceipt receipt) {
        // TODO: Implementar persistencia de PDF si se desea descargar luego sin
        // regenerar
        return "/uploads/receipts/receipt_" + receipt.getId() + ".pdf";
    }

    // DTOs
    @lombok.Data
    @lombok.Builder
    public static class LiquidationResult {
        private Long periodId;
        private String status;
        private Integer receiptsGenerated;
        private BigDecimal totalNetPay;
    }

    @lombok.Data
    @lombok.Builder
    public static class PaymentResult {
        private Long receiptId;
        private String employeeName;
        private BigDecimal netPay;
        private String status;
        private String pdfUrl;
        private Boolean emailSent;
        private String periodStatus;
    }

    @lombok.Data
    public static class PaymentRequest {
        private String paymentReference;
        private String paymentMethod;
        private String notes;
    }
}
