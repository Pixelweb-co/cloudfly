package com.app.starter1.controllers;

import com.app.starter1.dto.hr.PayrollReceiptDTO;
import com.app.starter1.persistence.entity.PayrollReceipt;
import com.app.starter1.services.PayrollProcessingService;
import com.app.starter1.services.PayrollNotificationService;
import com.app.starter1.persistence.repository.PayrollReceiptRepository;
import com.app.starter1.persistence.repository.PayrollPeriodRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/hr/payroll")
@RequiredArgsConstructor
public class PayrollProcessingController {

        private final PayrollProcessingService processingService;
        private final PayrollNotificationService notificationService;
        private final PayrollReceiptRepository receiptRepository;
        private final PayrollPeriodRepository periodRepository;
        private final CustomerRepository customerRepository;

        @PostMapping("/periods/{periodId}/process")
        public ResponseEntity<?> processPayroll(
                        @PathVariable Long periodId,
                        @RequestParam Long customerId) {

                PayrollProcessingService.ProcessingResult result = processingService.processPayroll(periodId,
                                customerId);

                return ResponseEntity.ok(Map.of(
                                "message", "Payroll processed successfully",
                                "processedCount", result.getProcessedCount(),
                                "errorsCount", result.getErrors().size(),
                                "periodStatus", result.getPeriod().getStatus().name()));
        }

        @PostMapping("/periods/{periodId}/approve")
        public ResponseEntity<?> approvePayroll(
                        @PathVariable Long periodId,
                        @RequestParam Long customerId) {

                processingService.approvePayroll(periodId, customerId);

                return ResponseEntity.ok(Map.of(
                                "message", "Payroll approved successfully"));
        }

        @PostMapping("/periods/{periodId}/pay")
        public ResponseEntity<?> registerPayment(
                        @PathVariable Long periodId,
                        @RequestParam Long customerId) {

                processingService.registerPayment(periodId, customerId);

                return ResponseEntity.ok(Map.of(
                                "message", "Payment registered successfully"));
        }

        @GetMapping("/periods/{periodId}/receipts")
        public ResponseEntity<List<PayrollReceiptDTO>> getReceiptsByPeriod(
                        @PathVariable Long periodId,
                        @RequestParam Long customerId) {

                var customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));

                var period = periodRepository.findByIdAndCustomer(periodId, customer)
                                .orElseThrow(() -> new RuntimeException("Period not found"));

                List<PayrollReceipt> receipts = receiptRepository.findByPayrollPeriod(period);

                List<PayrollReceiptDTO> dtos = receipts.stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(dtos);
        }

        @GetMapping("/receipts/{receiptId}")
        public ResponseEntity<PayrollReceiptDTO> getReceiptById(
                        @PathVariable Long receiptId,
                        @RequestParam Long customerId) {

                PayrollReceipt receipt = receiptRepository.findById(receiptId)
                                .orElseThrow(() -> new RuntimeException("Receipt not found"));

                return ResponseEntity.ok(convertToDTO(receipt));
        }

        // ========== ENDPOINTS DE ENVÍO DE COLILLAS ==========

        /**
         * Envía la colilla de pago de un recibo específico por email
         */
        @PostMapping("/receipts/{receiptId}/send-email")
        public ResponseEntity<?> sendReceiptByEmail(@PathVariable Long receiptId) {
                try {
                        notificationService.sendReceiptByEmail(receiptId);
                        return ResponseEntity.ok(Map.of(
                                        "message", "Colilla enviada exitosamente",
                                        "receiptId", receiptId));
                } catch (Exception e) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "error", e.getMessage()));
                }
        }

        /**
         * Envía todas las colillas de un período por email
         */
        @PostMapping("/periods/{periodId}/send-all-emails")
        public ResponseEntity<?> sendAllReceiptsByEmail(
                        @PathVariable Long periodId,
                        @RequestParam Long customerId) {
                try {
                        int sent = notificationService.sendReceiptsForPeriod(periodId, customerId);
                        return ResponseEntity.ok(Map.of(
                                        "message", sent + " colillas enviadas exitosamente",
                                        "sentCount", sent,
                                        "periodId", periodId));
                } catch (Exception e) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "error", e.getMessage()));
                }
        }

        /**
         * Descarga el PDF de una colilla sin enviarla
         */
        @GetMapping("/receipts/{receiptId}/download-pdf")
        public ResponseEntity<byte[]> downloadReceiptPdf(@PathVariable Long receiptId) {
                byte[] pdfBytes = notificationService.downloadReceiptPdf(receiptId);

                PayrollReceipt receipt = receiptRepository.findById(receiptId)
                                .orElseThrow(() -> new RuntimeException("Receipt not found"));

                return ResponseEntity.ok()
                                .header("Content-Type", "application/pdf")
                                .header("Content-Disposition",
                                                "attachment; filename=colilla_" + receipt.getReceiptNumber() + ".pdf")
                                .body(pdfBytes);
        }

        private PayrollReceiptDTO convertToDTO(PayrollReceipt receipt) {
                return PayrollReceiptDTO.builder()
                                .id(receipt.getId())
                                .employeeId(receipt.getEmployee().getId())
                                .employeeName(receipt.getEmployee().getFullName())
                                .employeeEmail(receipt.getEmployee().getEmail())
                                .periodId(receipt.getPayrollPeriod().getId())
                                .periodName(receipt.getPayrollPeriod().getPeriodName())
                                .receiptNumber(receipt.getReceiptNumber())
                                .calculationDate(receipt.getCalculationDate())
                                .regularDays(receipt.getRegularDays())
                                .absenceDays(receipt.getAbsenceDays())
                                .overtimeHours(receipt.getOvertimeHours())
                                .baseSalary(receipt.getBaseSalary())
                                .dailySalary(receipt.getDailySalary())
                                .totalPerceptions(receipt.getTotalPerceptions())
                                .totalDeductions(receipt.getTotalDeductions())
                                .netPay(receipt.getNetPay())
                                .isrAmount(receipt.getIsrAmount())
                                .imssAmount(receipt.getImssAmount())
                                .status(receipt.getStatus().name())
                                .isPaid(receipt.isPaid())
                                .isStamped(receipt.isStamped())
                                .build();
        }
}
