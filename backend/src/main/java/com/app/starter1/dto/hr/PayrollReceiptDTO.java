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
public class PayrollReceiptDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeEmail;
    private Long periodId;
    private String periodName;
    private String receiptNumber;
    private LocalDateTime calculationDate;

    private BigDecimal regularDays;
    private BigDecimal absenceDays;
    private BigDecimal overtimeHours;

    private BigDecimal baseSalary;
    private BigDecimal dailySalary;

    private BigDecimal totalPerceptions;
    private BigDecimal totalDeductions;
    private BigDecimal netPay;

    private BigDecimal isrAmount;
    private BigDecimal imssAmount;

    private String status;
    private String uuid;
    private Boolean isPaid;
    private Boolean isStamped;
}
