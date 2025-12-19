package com.app.starter1.dto.hr;

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
public class EmployeeDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String rfc;
    private String curp;
    private String nationalId;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String postalCode;
    private LocalDate birthDate;

    private String employeeNumber;
    private LocalDate hireDate;
    private LocalDate terminationDate;
    private String department;
    private String jobTitle;
    private String contractType;

    private BigDecimal baseSalary;
    private String paymentFrequency;
    private String paymentMethod;

    private String bankName;
    private String bankAccount;
    private String clabe;

    // Seguridad Social (Colombia)
    private String nss; // Número de Seguro Social
    private String eps; // EPS (Entidad Promotora de Salud)
    private String arl; // ARL (Administradora de Riesgos Laborales)
    private String afp; // AFP (Fondo de Pensiones)
    private String cesantiasBox; // Caja de Cesantías

    // Tipo de Salario (Colombia)
    private String salaryType; // ORDINARIO o INTEGRAL
    private Boolean hasTransportAllowance; // ¿Aplica auxilio de transporte?
    private String contractTypeEnum; // Tipo de contrato enum

    private Boolean isActive;
    private String notes;
}
