package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeePayrollDto {
    private String identificationType;
    private String identificationNumber;
    private String firstName;
    private String lastName;
    private String fullName;
    private String contractType;
    private String jobTitle;
    private BigDecimal salary;
    private LocalDate admissionDate;
    private LocalDate terminationDate;
    private String paymentMethod;
    private String bankAccount;
}
