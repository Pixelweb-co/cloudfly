package com.app.starter1.dto.hr;

import com.app.starter1.persistence.entity.PayrollNovelty.NoveltyStatus;
import com.app.starter1.persistence.entity.PayrollNovelty.NoveltyType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PayrollNoveltyDTO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private Long payrollPeriodId;
    private String periodName;
    private NoveltyType type;
    private String description;
    private LocalDate date;
    private BigDecimal amount;
    private BigDecimal quantity;
    private NoveltyStatus status;
}
