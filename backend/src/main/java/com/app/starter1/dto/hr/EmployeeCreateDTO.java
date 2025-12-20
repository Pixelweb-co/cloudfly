package com.app.starter1.dto.hr;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCreateDTO {

    @NotBlank(message = "First name is required")
    @Size(max = 100)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    private String lastName;

    @Size(max = 13)
    private String rfc;

    @Size(max = 18)
    private String curp;

    @Size(max = 50)
    private String nationalId;

    @Email
    @Size(max = 100)
    private String email;

    @Size(max = 20)
    private String phone;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String city;

    @Size(max = 100)
    private String state;

    @Size(max = 10)
    private String postalCode;

    private LocalDate birthDate;

    @Size(max = 20)
    private String employeeNumber;

    @NotNull(message = "Hire date is required")
    private LocalDate hireDate;

    private LocalDate terminationDate;

    @Size(max = 100)
    private String department;

    // Centro de costo para contabilidad analítica
    private Long costCenterId;

    @Size(max = 100)
    private String jobTitle;

    @Size(max = 50)
    private String contractType;

    @NotNull(message = "Base salary is required")
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal baseSalary;

    @NotBlank(message = "Payment frequency is required")
    private String paymentFrequency;

    private String paymentMethod;

    @Size(max = 100)
    private String bankName;

    @Size(max = 50)
    private String bankAccount;

    @Size(max = 18)
    private String clabe;

    // === SEGURIDAD SOCIAL (Colombia) ===
    @Size(max = 15)
    private String nss; // Número de Seguro Social (México)

    @Size(max = 100)
    private String eps; // EPS (Colombia)

    @Size(max = 100)
    private String arl; // ARL (Colombia)

    @Size(max = 100)
    private String afp; // Fondo de Pensiones (Colombia)

    @Size(max = 100)
    private String cesantiasBox; // Caja de Cesantías (Colombia)

    // === TIPO DE SALARIO (Colombia) ===
    private String salaryType; // ORDINARIO o INTEGRAL
    private Boolean hasTransportAllowance = true; // ¿Aplica auxilio de transporte?
    private Boolean hasFamilySubsidy = false; // ¿Aplica subsidio familiar?
    private String contractTypeEnum; // Tipo de contrato enum

    private Boolean isActive = true;

    private String notes;
}
