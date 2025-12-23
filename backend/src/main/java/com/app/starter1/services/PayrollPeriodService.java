package com.app.starter1.services;

import com.app.starter1.dto.hr.PayrollPeriodDTO;
import com.app.starter1.persistence.entity.PayrollPeriod;
import com.app.starter1.persistence.entity.Employee;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.PayrollPeriodRepository;
import com.app.starter1.persistence.repository.EmployeeRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollPeriodService {

        private final PayrollPeriodRepository periodRepository;
        private final EmployeeRepository employeeRepository;
        private final CustomerRepository customerRepository;

        @Transactional(readOnly = true)
        public Page<PayrollPeriodDTO> getAllPeriods(Long customerId, Pageable pageable) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                return periodRepository.findByCustomerOrderByYearDescPeriodNumberDesc(customer, pageable)
                                .map(this::convertToDTO);
        }

        @Transactional(readOnly = true)
        public PayrollPeriodDTO getCurrentPeriod(Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));

                // Find the most recent OPEN period
                return periodRepository.findByCustomerOrderByYearDescPeriodNumberDesc(customer, Pageable.unpaged())
                                .stream()
                                .filter(p -> p.getStatus() == PayrollPeriod.PeriodStatus.OPEN)
                                .findFirst()
                                .map(this::convertToDTO)
                                .orElse(null);
        }

        @Transactional(readOnly = true)
        public boolean hasOpenPeriod(Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                return periodRepository.findByCustomerOrderByYearDescPeriodNumberDesc(customer, Pageable.unpaged())
                                .stream()
                                .anyMatch(p -> p.getStatus() == PayrollPeriod.PeriodStatus.OPEN);
        }

        @Transactional(readOnly = true)
        public PayrollPeriodDTO getPeriodById(Long id, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollPeriod period = periodRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Period not found"));
                return convertToDTO(period);
        }

        @Transactional
        public PayrollPeriodDTO createPeriod(PayrollPeriodDTO dto, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));

                // Validar que no haya periodos abiertos
                boolean hasOpen = periodRepository
                                .findByCustomerOrderByYearDescPeriodNumberDesc(customer, Pageable.unpaged())
                                .stream()
                                .anyMatch(p -> p.getStatus() == PayrollPeriod.PeriodStatus.OPEN);

                if (hasOpen) {
                        throw new RuntimeException(
                                        "Ya existe un período activo. Debe cerrar el período actual antes de crear uno nuevo.");
                }

                PayrollPeriod period = PayrollPeriod.builder()
                                .customer(customer)
                                .periodType(PayrollPeriod.PeriodType.valueOf(dto.getPeriodType()))
                                .periodNumber(dto.getPeriodNumber())
                                .year(dto.getYear())
                                .startDate(dto.getStartDate())
                                .endDate(dto.getEndDate())
                                .paymentDate(dto.getPaymentDate())
                                .status(PayrollPeriod.PeriodStatus.OPEN)
                                .description(dto.getDescription())
                                .assignedEmployees(new HashSet<>())
                                .totalPayroll(BigDecimal.ZERO)
                                .build();

                // Asignar empleados si se proporcionan IDs
                if (dto.getEmployeeIds() != null && !dto.getEmployeeIds().isEmpty()) {
                        Set<Employee> employees = new HashSet<>(employeeRepository.findAllById(dto.getEmployeeIds()));
                        period.setAssignedEmployees(employees);

                        // Calcular total de nómina basado en salarios
                        BigDecimal total = employees.stream()
                                        .filter(e -> e.getBaseSalary() != null)
                                        .map(Employee::getBaseSalary)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                        period.setTotalPayroll(total);
                }

                period = periodRepository.save(period);
                log.info("Created period: {}", period.getPeriodName());

                return convertToDTO(period);
        }

        @Transactional
        public PayrollPeriodDTO updatePeriod(Long id, PayrollPeriodDTO dto, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollPeriod period = periodRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Period not found"));

                // Solo se puede editar el periodo activo (OPEN)
                if (period.getStatus() != PayrollPeriod.PeriodStatus.OPEN) {
                        throw new RuntimeException("Solo se puede editar el período activo");
                }

                // Update fields
                if (dto.getPeriodType() != null) {
                        period.setPeriodType(PayrollPeriod.PeriodType.valueOf(dto.getPeriodType()));
                }
                if (dto.getPeriodNumber() != null) {
                        period.setPeriodNumber(dto.getPeriodNumber());
                }
                if (dto.getYear() != null) {
                        period.setYear(dto.getYear());
                }
                if (dto.getStartDate() != null) {
                        period.setStartDate(dto.getStartDate());
                }
                if (dto.getEndDate() != null) {
                        period.setEndDate(dto.getEndDate());
                }
                if (dto.getPaymentDate() != null) {
                        period.setPaymentDate(dto.getPaymentDate());
                }
                if (dto.getDescription() != null) {
                        period.setDescription(dto.getDescription());
                }

                // Actualizar empleados si se proporcionan IDs
                if (dto.getEmployeeIds() != null) {
                        Set<Employee> employees = new HashSet<>(employeeRepository.findAllById(dto.getEmployeeIds()));
                        period.setAssignedEmployees(employees);

                        // Recalcular total de nómina
                        BigDecimal total = employees.stream()
                                        .filter(e -> e.getBaseSalary() != null)
                                        .map(Employee::getBaseSalary)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                        period.setTotalPayroll(total);
                }

                period = periodRepository.save(period);
                log.info("Updated period: {}", period.getPeriodName());

                return convertToDTO(period);
        }

        @Transactional
        public void updatePeriodStatus(Long id, String status, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollPeriod period = periodRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Period not found"));

                period.setStatus(PayrollPeriod.PeriodStatus.valueOf(status));

                if (status.equals("CLOSED")) {
                        period.setCloseDate(LocalDate.now());
                }

                periodRepository.save(period);
        }

        @Transactional
        public void deletePeriod(Long id, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollPeriod period = periodRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Period not found"));

                // Solo se puede eliminar el periodo activo (OPEN)
                if (period.getStatus() != PayrollPeriod.PeriodStatus.OPEN) {
                        throw new RuntimeException("Solo se puede eliminar el período activo");
                }

                periodRepository.delete(period);
                log.info("Deleted period: {}", period.getPeriodName());
        }

        private PayrollPeriodDTO convertToDTO(PayrollPeriod period) {
                // Calcular valores proporcionales
                BigDecimal elapsedPayroll = BigDecimal.ZERO;
                if (period.getTotalPayroll() != null && period.getTotalPayroll().compareTo(BigDecimal.ZERO) > 0) {
                        LocalDate today = LocalDate.now();
                        long totalDays = ChronoUnit.DAYS.between(period.getStartDate(), period.getEndDate()) + 1;
                        long elapsedDays = ChronoUnit.DAYS.between(period.getStartDate(), today) + 1;

                        if (elapsedDays > 0 && elapsedDays <= totalDays) {
                                elapsedPayroll = period.getTotalPayroll()
                                                .multiply(BigDecimal.valueOf(elapsedDays))
                                                .divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP);
                        } else if (elapsedDays > totalDays) {
                                elapsedPayroll = period.getTotalPayroll();
                        }
                }

                List<Long> empIds = period.getAssignedEmployees() != null
                                ? period.getAssignedEmployees().stream().map(Employee::getId)
                                                .collect(Collectors.toList())
                                : List.of();

                return PayrollPeriodDTO.builder()
                                .id(period.getId())
                                .periodType(period.getPeriodType().name())
                                .periodNumber(period.getPeriodNumber())
                                .year(period.getYear())
                                .startDate(period.getStartDate())
                                .endDate(period.getEndDate())
                                .paymentDate(period.getPaymentDate())
                                .status(period.getStatus().name())
                                .description(period.getDescription())
                                .periodName(period.getPeriodName())
                                .workingDays(period.getWorkingDays())
                                .employeeIds(empIds)
                                .employeeCount(period.getAssignedEmployees() != null
                                                ? period.getAssignedEmployees().size()
                                                : 0)
                                .totalPayroll(period.getTotalPayroll())
                                .elapsedPayroll(elapsedPayroll)
                                .build();
        }
}
