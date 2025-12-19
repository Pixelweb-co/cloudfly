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
 * Servicio para procesamiento de nómina
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollProcessingService {

    private final PayrollCalculationService calculationService;
    private final EmployeeRepository employeeRepository;
    private final PayrollPeriodRepository periodRepository;
    private final PayrollReceiptRepository receiptRepository;
    private final PayrollReceiptDetailRepository receiptDetailRepository;
    private final CustomerRepository customerRepository;

    /**
     * Procesa la nómina completa de un periodo
     */
    @Transactional
    public ProcessingResult processPayroll(Long periodId, Long customerId) {
        log.info("Processing payroll for period: {}", periodId);

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        PayrollPeriod period = periodRepository.findByIdAndCustomer(periodId, customer)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (period.getStatus() != PayrollPeriod.PeriodStatus.OPEN) {
            throw new RuntimeException("Period must be in OPEN status to process");
        }

        ProcessingResult result = new ProcessingResult();
        result.setPeriod(period);

        // Obtener empleados activos
        List<Employee> employees = employeeRepository.findByCustomerAndIsActiveTrueAndDeletedAtIsNull(customer);

        log.info("Processing payroll for {} employees", employees.size());

        List<PayrollReceipt> receipts = new ArrayList<>();

        for (Employee employee : employees) {
            try {
                PayrollReceipt receipt = processEmployeePayroll(employee, period);
                receipts.add(receipt);
                result.incrementProcessed();
            } catch (Exception e) {
                log.error("Error processing payroll for employee: {}", employee.getId(), e);
                result.addError(employee.getId(), e.getMessage());
            }
        }

        // Actualizar estado del periodo
        period.setStatus(PayrollPeriod.PeriodStatus.LIQUIDATED);
        periodRepository.save(period);

        result.setReceipts(receipts);
        log.info("Payroll processing completed: {} processed, {} errors",
                result.getProcessedCount(), result.getErrors().size());

        return result;
    }

    /**
     * Procesa la nómina de un empleado individual
     */
    @Transactional
    public PayrollReceipt processEmployeePayroll(Employee employee, PayrollPeriod period) {
        log.info("Processing payroll for employee: {} - {}",
                employee.getEmployeeNumber(), employee.getFullName());

        // Verificar si ya existe un recibo para este empleado y periodo
        receiptRepository.findByPayrollPeriodAndEmployee(period, employee)
                .ifPresent(existing -> {
                    log.warn("Receipt already exists, deleting old one");
                    receiptDetailRepository.deleteByPayrollReceipt(existing);
                    receiptRepository.delete(existing);
                });

        // Calcular nómina
        PayrollCalculationService.PayrollCalculationResult calculation = calculationService.calculatePayroll(employee,
                period);

        // Crear recibo
        PayrollReceipt receipt = new PayrollReceipt();
        receipt.setEmployee(employee);
        receipt.setPayrollPeriod(period);
        receipt.setReceiptNumber(generateReceiptNumber(period, employee));
        receipt.setCalculationDate(LocalDateTime.now());

        receipt.setRegularDays(BigDecimal.valueOf(calculation.getWorkingDays()));
        receipt.setAbsenceDays(BigDecimal.ZERO); // TODO: calcular desde incidencias
        receipt.setOvertimeHours(BigDecimal.ZERO); // TODO: calcular desde incidencias

        receipt.setBaseSalary(employee.getBaseSalary());
        receipt.setDailySalary(calculation.getDailySalary());

        receipt.setTotalPerceptions(calculation.getTotalPerceptions());
        receipt.setTotalDeductions(calculation.getTotalDeductions());
        receipt.setNetPay(calculation.getNetPay());

        // Calcular ISR e IMSS de los detalles
        receipt.setIsrAmount(calculation.getDeductions().stream()
                .filter(d -> "ISR".equals(d.getCode()))
                .map(d -> d.getAmount())
                .findFirst()
                .orElse(java.math.BigDecimal.ZERO));

        receipt.setImssAmount(calculation.getDeductions().stream()
                .filter(d -> "IMSS".equals(d.getCode()))
                .map(d -> d.getAmount())
                .findFirst()
                .orElse(java.math.BigDecimal.ZERO));

        receipt.setStatus(PayrollReceipt.ReceiptStatus.PENDING);

        receipt = receiptRepository.save(receipt);

        // Crear detalles de percepciones
        int sortOrder = 1;
        for (PayrollCalculationService.Perception perception : calculation.getPerceptions()) {
            PayrollReceiptDetail detail = new PayrollReceiptDetail();
            detail.setPayrollReceipt(receipt);
            detail.setConceptType(PayrollConcept.ConceptType.PERCEPCION);
            detail.setConceptCode(perception.getCode());
            detail.setConceptName(perception.getName());
            detail.setAmount(perception.getAmount());
            detail.setIsTaxable(true); // TODO: obtener del concepto
            detail.setSortOrder(sortOrder++);
            receiptDetailRepository.save(detail);
        }

        // Crear detalles de deducciones
        for (PayrollCalculationService.Deduction deduction : calculation.getDeductions()) {
            PayrollReceiptDetail detail = new PayrollReceiptDetail();
            detail.setPayrollReceipt(receipt);
            detail.setConceptType(PayrollConcept.ConceptType.DEDUCCION);
            detail.setConceptCode(deduction.getCode());
            detail.setConceptName(deduction.getName());
            detail.setAmount(deduction.getAmount());
            detail.setIsTaxable(false);
            detail.setSortOrder(sortOrder++);
            receiptDetailRepository.save(detail);
        }

        log.info("Receipt created: {} - Net pay: {}", receipt.getReceiptNumber(), receipt.getNetPay());

        return receipt;
    }

    /**
     * Aprueba la nómina del periodo
     */
    @Transactional
    public void approvePayroll(Long periodId, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        PayrollPeriod period = periodRepository.findByIdAndCustomer(periodId, customer)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (period.getStatus() != PayrollPeriod.PeriodStatus.LIQUIDATED) {
            throw new RuntimeException("Period must be in LIQUIDATED status to approve");
        }

        List<PayrollReceipt> receipts = receiptRepository.findByPayrollPeriod(period);
        for (PayrollReceipt receipt : receipts) {
            receipt.setStatus(PayrollReceipt.ReceiptStatus.APPROVED);
            receiptRepository.save(receipt);
        }

        period.setStatus(PayrollPeriod.PeriodStatus.PAID);
        periodRepository.save(period);

        log.info("Payroll approved for period: {}", period.getPeriodName());
    }

    /**
     * Registra el pago de la nómina
     */
    @Transactional
    public void registerPayment(Long periodId, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        PayrollPeriod period = periodRepository.findByIdAndCustomer(periodId, customer)
                .orElseThrow(() -> new RuntimeException("Period not found"));

        if (period.getStatus() != PayrollPeriod.PeriodStatus.APPROVED) {
            throw new RuntimeException("Period must be in APPROVED status to register payment");
        }

        List<PayrollReceipt> receipts = receiptRepository.findByPayrollPeriod(period);
        for (PayrollReceipt receipt : receipts) {
            receipt.setStatus(PayrollReceipt.ReceiptStatus.PAID);
            receipt.setPaidAt(LocalDateTime.now());
            receiptRepository.save(receipt);
        }

        period.setStatus(PayrollPeriod.PeriodStatus.PAID);
        periodRepository.save(period);

        log.info("Payment registered for period: {}", period.getPeriodName());
    }

    private String generateReceiptNumber(PayrollPeriod period, Employee employee) {
        return String.format("%s-%04d-%s",
                period.getYear(),
                period.getPeriodNumber(),
                employee.getEmployeeNumber() != null ? employee.getEmployeeNumber() : employee.getId());
    }

    // Resultado del procesamiento
    @lombok.Data
    public static class ProcessingResult {
        private PayrollPeriod period;
        private List<PayrollReceipt> receipts = new ArrayList<>();
        private int processedCount = 0;
        private List<ProcessingError> errors = new ArrayList<>();

        public void incrementProcessed() {
            processedCount++;
        }

        public void addError(Long employeeId, String message) {
            errors.add(new ProcessingError(employeeId, message));
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ProcessingError {
        private Long employeeId;
        private String message;
    }
}
