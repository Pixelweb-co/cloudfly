package com.app.starter1.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePayrollHistoryDTO {
    private Long id;
    private String receiptNumber;
    private Long periodId;
    private String periodName;
    private Integer periodYear;
    private Integer periodNumber;
    private String periodType;
    private LocalDateTime calculationDate;

    // Amounts
    private BigDecimal baseSalary;
    private BigDecimal totalPerceptions;
    private BigDecimal totalDeductions;
    private BigDecimal netPay;

    // Status
    private String status;
    private LocalDateTime paidAt;

    // PDF
    private String pdfPath;
}
