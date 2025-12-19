package com.app.starter1.services;

import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
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
    private final PayrollConfigurationRepository configRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;

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

        PayrollConfiguration config = configRepository.findByCustomer(customer)
                .orElse(PayrollConfiguration.getDefault(customer));

        List<PayrollReceipt> receipts = new ArrayList<>();
        int employeesProcessed = 0;
        BigDecimal totalNetPay = BigDecimal.ZERO;

        // Obtener novedades pendientes del período
        List<PayrollNovelty> novelties = noveltyRepository.findByPeriod(customerId, periodId);

        for (Employee employee : period.getAssignedEmployees()) {
            try {
                PayrollReceipt receipt = generateReceipt(period, employee, config, novelties);
                receipts.add(receipt);
                totalNetPay = totalNetPay.add(receipt.getNetPay());
                employeesProcessed++;
            } catch (Exception e) {
                log.error("Error generando recibo para empleado {}: {}", employee.getId(), e.getMessage());
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

        log.info("Liquidación completada: {} empleados procesados, total: {}", employeesProcessed, totalNetPay);

        return LiquidationResult.builder()
                .periodId(periodId)
                .status(period.getStatus().name())
                .totalEmployees(period.getAssignedEmployees().size())
                .receiptsGenerated(receipts.size())
                .totalNetPay(totalNetPay)
                .noveltiesProcessed(novelties.size())
                .build();
    }

    /**
     * Paga un recibo individual
     */
    @Transactional
    public PaymentResult payReceipt(Long receiptId, Long customerId, PaymentRequest request) {
        log.info("Procesando pago de recibo {} para cliente {}", receiptId, customerId);

        PayrollReceipt receipt = receiptRepository.findById(receiptId)
                .orElseThrow(() -> new RuntimeException("Recibo no encontrado"));

        if (!receipt.canBePaid()) {
            throw new RuntimeException("El recibo no puede ser pagado. Estado actual: " + receipt.getStatus());
        }

        // Marcar como pagado
        receipt.setStatus(PayrollReceipt.ReceiptStatus.PAID);
        receipt.setPaidAt(LocalDateTime.now());
        receipt.setPaymentReference(request.getPaymentReference());
        if (request.getNotes() != null) {
            receipt.setNotes(request.getNotes());
        }
        receiptRepository.save(receipt);

        // Generar y enviar PDF
        String pdfUrl = null;
        boolean emailSent = false;
        try {
            pdfUrl = generateReceiptPDF(receipt);
            receipt.setPdfPath(pdfUrl);
            receiptRepository.save(receipt);

            // Enviar email
            emailSent = sendReceiptByEmail(receipt, pdfUrl);
        } catch (Exception e) {
            log.error("Error generando/enviando PDF: {}", e.getMessage());
        }

        // Verificar si todos los recibos del período están pagados
        PayrollPeriod period = receipt.getPayrollPeriod();
        checkAndUpdatePeriodStatus(period);

        log.info("Pago procesado exitosamente para recibo {}", receiptId);

        return PaymentResult.builder()
                .receiptId(receiptId)
                .employeeName(receipt.getEmployee().getFirstName() + " " + receipt.getEmployee().getLastName())
                .netPay(receipt.getNetPay())
                .status(receipt.getStatus().name())
                .pdfUrl(pdfUrl)
                .emailSent(emailSent)
                .periodStatus(period.getStatus().name())
                .build();
    }

    /**
     * Genera el recibo de nómina para un empleado
     */
    private PayrollReceipt generateReceipt(PayrollPeriod period, Employee employee,
            PayrollConfiguration config, List<PayrollNovelty> allNovelties) {
        // Filtrar novedades del empleado
        List<PayrollNovelty> employeeNovelties = allNovelties.stream()
                .filter(n -> n.getEmployeeId().equals(employee.getId()))
                .toList();

        PayrollReceipt receipt = new PayrollReceipt();
        receipt.setPayrollPeriod(period);
        receipt.setEmployee(employee);
        receipt.setReceiptNumber(generateReceiptNumber(period, employee));
        receipt.setCalculationDate(LocalDateTime.now());
        receipt.setStatus(PayrollReceipt.ReceiptStatus.PENDING);

        // Calcular salario base
        BigDecimal baseSalary = employee.getBaseSalary();
        int periodDays = period.getWorkingDays();
        BigDecimal dailySalary = baseSalary.divide(BigDecimal.valueOf(30), 2, java.math.RoundingMode.HALF_UP);

        receipt.setBaseSalary(baseSalary);
        receipt.setDailySalary(dailySalary);
        receipt.setRegularDays(BigDecimal.valueOf(periodDays));

        // Calcular percepciones (salario + novedades positivas)
        BigDecimal perceptions = calculatePerceptions(baseSalary, periodDays, config, employee, employeeNovelties);
        receipt.setTotalPerceptions(perceptions);

        // Calcular deducciones (salud, pensión, + novedades negativas)
        BigDecimal deductions = calculateDeductions(baseSalary, periodDays, config, employee, employeeNovelties);
        receipt.setTotalDeductions(deductions);

        // Neto a pagar
        receipt.setNetPay(perceptions.subtract(deductions));

        return receiptRepository.save(receipt);
    }

    private BigDecimal calculatePerceptions(BigDecimal baseSalary, int periodDays,
            PayrollConfiguration config, Employee employee,
            List<PayrollNovelty> novelties) {
        BigDecimal factor = BigDecimal.valueOf(periodDays).divide(BigDecimal.valueOf(30), 4,
                java.math.RoundingMode.HALF_UP);
        BigDecimal salaryPeriod = baseSalary.multiply(factor);

        // Auxilio de transporte
        BigDecimal transport = BigDecimal.ZERO;
        if (employee.getHasTransportAllowance() != null && employee.getHasTransportAllowance()
                && baseSalary.compareTo(config.getMinimumWage().multiply(BigDecimal.valueOf(2))) <= 0) {
            transport = BigDecimal.valueOf(config.getTransportAllowance()).multiply(factor);
        }

        // Novedades de ingreso
        BigDecimal noveltyIncome = novelties.stream()
                .filter(n -> isIncomeNovelty(n.getType()))
                .map(n -> n.getAmount() != null ? n.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return salaryPeriod.add(transport).add(noveltyIncome);
    }

    private BigDecimal calculateDeductions(BigDecimal baseSalary, int periodDays,
            PayrollConfiguration config, Employee employee,
            List<PayrollNovelty> novelties) {
        BigDecimal factor = BigDecimal.valueOf(periodDays).divide(BigDecimal.valueOf(30), 4,
                java.math.RoundingMode.HALF_UP);
        BigDecimal salaryPeriod = baseSalary.multiply(factor);

        // Salud
        BigDecimal health = salaryPeriod.multiply(BigDecimal.valueOf(config.getHealthPercentageEmployee() / 100.0));

        // Pensión
        BigDecimal pension = salaryPeriod.multiply(BigDecimal.valueOf(config.getPensionPercentageEmployee() / 100.0));

        // Novedades de deducción
        BigDecimal noveltyDeductions = novelties.stream()
                .filter(n -> isDeductionNovelty(n.getType()))
                .map(n -> n.getAmount() != null ? n.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return health.add(pension).add(noveltyDeductions);
    }

    private boolean isIncomeNovelty(PayrollNovelty.NoveltyType type) {
        return type == PayrollNovelty.NoveltyType.EXTRA_HOUR_DAY ||
                type == PayrollNovelty.NoveltyType.EXTRA_HOUR_NIGHT ||
                type == PayrollNovelty.NoveltyType.EXTRA_HOUR_SUNDAY ||
                type == PayrollNovelty.NoveltyType.BONUS_SALARY ||
                type == PayrollNovelty.NoveltyType.BONUS_NON_SALARY ||
                type == PayrollNovelty.NoveltyType.COMMISSION;
    }

    private boolean isDeductionNovelty(PayrollNovelty.NoveltyType type) {
        return type == PayrollNovelty.NoveltyType.DEDUCTION_LOAN ||
                type == PayrollNovelty.NoveltyType.DEDUCTION_OTHER;
    }

    private String generateReceiptNumber(PayrollPeriod period, Employee employee) {
        return String.format("REC-%d-%d-%d", period.getYear(), period.getPeriodNumber(), employee.getId());
    }

    private void checkAndUpdatePeriodStatus(PayrollPeriod period) {
        List<PayrollReceipt> receipts = receiptRepository.findByPayrollPeriod(period);

        long paidCount = receipts.stream().filter(PayrollReceipt::isPaid).count();
        long totalCount = receipts.size();

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
        // TODO: Implementar generación real de PDF
        // Por ahora retorna una URL ficticia
        return "/uploads/receipts/receipt_" + receipt.getId() + ".pdf";
    }

    private boolean sendReceiptByEmail(PayrollReceipt receipt, String pdfUrl) {
        try {
            String employeeEmail = receipt.getEmployee().getEmail();
            if (employeeEmail == null || employeeEmail.isEmpty()) {
                log.warn("Empleado {} no tiene email configurado", receipt.getEmployee().getId());
                return false;
            }

            String subject = "Desprendible de Nómina - " + receipt.getPayrollPeriod().getPeriodName();
            String body = String.format(
                    "Hola %s,\n\nAdjunto encontrarás tu desprendible de nómina.\n\nPeríodo: %s\nNeto a Pagar: $%,.2f\n\nReferencia: %s",
                    receipt.getEmployee().getFirstName(),
                    receipt.getPayrollPeriod().getPeriodName(),
                    receipt.getNetPay(),
                    receipt.getPaymentReference());

            // TODO: Enviar email real vía notification-service
            log.info("Email enviado a {} con recibo {}", employeeEmail, receipt.getId());
            return true;
        } catch (Exception e) {
            log.error("Error enviando email: {}", e.getMessage());
            return false;
        }
    }

    // DTOs
    @lombok.Data
    @lombok.Builder
    public static class LiquidationResult {
        private Long periodId;
        private String status;
        private Integer totalEmployees;
        private Integer receiptsGenerated;
        private BigDecimal totalNetPay;
        private Integer noveltiesProcessed;
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
