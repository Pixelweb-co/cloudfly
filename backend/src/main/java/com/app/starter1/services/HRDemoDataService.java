package com.app.starter1.services;

import com.app.starter1.dto.hr.EmployeeCreateDTO;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class HRDemoDataService {

    private final EmployeeService employeeService;
    private final PayrollConceptService conceptService;
    private final PayrollPeriodService periodService;
    private final CustomerRepository customerRepository;

    @Transactional
    public void generateDemoData(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        log.info("Generating demo data for customer: {}", customer.getId());

        // 1. Inicializar conceptos
        conceptService.initializeDefaultConcepts(customerId);

        // 2. Crear empleados de demo
        createDemoEmployees(customerId);

        log.info("Demo data generated successfully");
    }

    private void createDemoEmployees(Long customerId) {
        // Empleado 1: Gerente
        EmployeeCreateDTO emp1 = new EmployeeCreateDTO();
        emp1.setFirstName("Juan");
        emp1.setLastName("Pérez García");
        emp1.setEmail("juan.perez@empresa.com");
        emp1.setPhone("555-1234");
        emp1.setEmployeeNumber("EMP001");
        emp1.setHireDate(LocalDate.of(2020, 1, 15));
        emp1.setDepartment("Gerencia");
        emp1.setJobTitle("Gerente General");
        emp1.setContractType("Indefinido");
        emp1.setBaseSalary(new BigDecimal("45000.00"));
        emp1.setPaymentFrequency("MONTHLY");
        emp1.setPaymentMethod("BANK_TRANSFER");
        emp1.setBankName("BBVA");
        emp1.setBankAccount("0123456789");
        emp1.setClabe("012180001234567890");
        emp1.setRfc("PEGJ850115ABC");
        emp1.setCurp("PEGJ850115HDFRNS09");
        emp1.setIsActive(true);
        employeeService.createEmployee(emp1, customerId);

        // Empleado 2: Contador
        EmployeeCreateDTO emp2 = new EmployeeCreateDTO();
        emp2.setFirstName("María");
        emp2.setLastName("González López");
        emp2.setEmail("maria.gonzalez@empresa.com");
        emp2.setPhone("555-5678");
        emp2.setEmployeeNumber("EMP002");
        emp2.setHireDate(LocalDate.of(2021, 3, 1));
        emp2.setDepartment("Contabilidad");
        emp2.setJobTitle("Contador");
        emp2.setContractType("Indefinido");
        emp2.setBaseSalary(new BigDecimal("25000.00"));
        emp2.setPaymentFrequency("MONTHLY");
        emp2.setPaymentMethod("BANK_TRANSFER");
        emp2.setBankName("Santander");
        emp2.setBankAccount("9876543210");
        emp2.setClabe("014180009876543210");
        emp2.setRfc("GOLM900320DEF");
        emp2.setCurp("GOLM900320MDFLPS05");
        emp2.setIsActive(true);
        employeeService.createEmployee(emp2, customerId);

        // Empleado 3: Desarrollador
        EmployeeCreateDTO emp3 = new EmployeeCreateDTO();
        emp3.setFirstName("Carlos");
        emp3.setLastName("Ramírez Sánchez");
        emp3.setEmail("carlos.ramirez@empresa.com");
        emp3.setPhone("555-9012");
        emp3.setEmployeeNumber("EMP003");
        emp3.setHireDate(LocalDate.of(2022, 6, 15));
        emp3.setDepartment("Tecnología");
        emp3.setJobTitle("Desarrollador Senior");
        emp3.setContractType("Indefinido");
        emp3.setBaseSalary(new BigDecimal("35000.00"));
        emp3.setPaymentFrequency("MONTHLY");
        emp3.setPaymentMethod("BANK_TRANSFER");
        emp3.setBankName("Banorte");
        emp3.setBankAccount("1122334455");
        emp3.setClabe("072180001122334455");
        emp3.setRfc("RASC950710GHI");
        emp3.setCurp("RASC950710HDFCNR02");
        emp3.setIsActive(true);
        employeeService.createEmployee(emp3, customerId);

        // Empleado 4: Vendedor
        EmployeeCreateDTO emp4 = new EmployeeCreateDTO();
        emp4.setFirstName("Ana");
        emp4.setLastName("Martínez Torres");
        emp4.setEmail("ana.martinez@empresa.com");
        emp4.setPhone("555-3456");
        emp4.setEmployeeNumber("EMP004");
        emp4.setHireDate(LocalDate.of(2023, 2, 1));
        emp4.setDepartment("Ventas");
        emp4.setJobTitle("Ejecutivo de Ventas");
        emp4.setContractType("Indefinido");
        emp4.setBaseSalary(new BigDecimal("18000.00"));
        emp4.setPaymentFrequency("BIWEEKLY");
        emp4.setPaymentMethod("BANK_TRANSFER");
        emp4.setBankName("HSBC");
        emp4.setBankAccount("6677889900");
        emp4.setClabe("021180006677889900");
        emp4.setRfc("MATA920815JKL");
        emp4.setCurp("MATA920815MDFRRN08");
        emp4.setIsActive(true);
        employeeService.createEmployee(emp4, customerId);

        // Empleado 5: Asistente Administrativo
        EmployeeCreateDTO emp5 = new EmployeeCreateDTO();
        emp5.setFirstName("Luis");
        emp5.setLastName("Hernández Jiménez");
        emp5.setEmail("luis.hernandez@empresa.com");
        emp5.setPhone("555-7890");
        emp5.setEmployeeNumber("EMP005");
        emp5.setHireDate(LocalDate.of(2023, 9, 1));
        emp5.setDepartment("Administración");
        emp5.setJobTitle("Asistente Administrativo");
        emp5.setContractType("Temporal");
        emp5.setBaseSalary(new BigDecimal("12000.00"));
        emp5.setPaymentFrequency("BIWEEKLY");
        emp5.setPaymentMethod("BANK_TRANSFER");
        emp5.setBankName("Scotiabank");
        emp5.setBankAccount("4455667788");
        emp5.setClabe("044180004455667788");
        emp5.setRfc("HEJL980520MNO");
        emp5.setCurp("HEJL980520HDFRMS04");
        emp5.setIsActive(true);
        employeeService.createEmployee(emp5, customerId);

        log.info("Created 5 demo employees");
    }
}
