package com.app.starter1.persistence.services;

import com.app.starter1.dto.hr.PayrollNoveltyDTO;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.Employee;
import com.app.starter1.persistence.entity.PayrollNovelty;
import com.app.starter1.persistence.entity.PayrollPeriod;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.EmployeeRepository;
import com.app.starter1.persistence.repos.PayrollNoveltyRepository; // Este si lo cree en repos
import com.app.starter1.persistence.repository.PayrollPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PayrollNoveltyService {

    private final PayrollNoveltyRepository noveltyRepository;
    private final EmployeeRepository employeeRepository;
    private final PayrollPeriodRepository periodRepository;
    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public Page<PayrollNoveltyDTO> getAll(Long customerId, Pageable pageable) {
        return noveltyRepository.findByCustomerId(customerId, pageable)
                .map(this::toDTO);
    }

    @Transactional
    public PayrollNoveltyDTO create(PayrollNoveltyDTO dto, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        PayrollPeriod period = null;
        if (dto.getPayrollPeriodId() != null) {
            period = periodRepository.findById(dto.getPayrollPeriodId())
                    .orElseThrow(() -> new RuntimeException("Período no encontrado"));
        }

        PayrollNovelty novelty = PayrollNovelty.builder()
                .customer(customer)
                .employee(employee)
                .payrollPeriod(period)
                .type(dto.getType())
                .description(dto.getDescription())
                .date(dto.getDate())
                .amount(dto.getAmount())
                .quantity(dto.getQuantity())
                .status(PayrollNovelty.NoveltyStatus.PENDING)
                .build();

        return toDTO(noveltyRepository.save(novelty));
    }

    @Transactional
    public void delete(Long id, Long customerId) {
        PayrollNovelty novelty = noveltyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Novedad no encontrada"));

        if (!novelty.getCustomer().getId().equals(customerId)) {
            throw new RuntimeException("No autorizado");
        }

        if (novelty.getStatus() == PayrollNovelty.NoveltyStatus.PROCESSED) {
            throw new RuntimeException("No se puede eliminar una novedad procesada");
        }

        noveltyRepository.delete(novelty);
    }

    private PayrollNoveltyDTO toDTO(PayrollNovelty entity) {
        String periodName = null;
        if (entity.getPayrollPeriod() != null) {
            periodName = entity.getPayrollPeriod().getPeriodName();
        }

        return PayrollNoveltyDTO.builder()
                .id(entity.getId())
                .employeeId(entity.getEmployeeId())
                .employeeName(entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName())
                .payrollPeriodId(entity.getPayrollPeriodId())
                .periodName(periodName)
                .type(entity.getType())
                .description(entity.getDescription())
                .date(entity.getDate())
                .amount(entity.getAmount())
                .quantity(entity.getQuantity())
                .status(entity.getStatus())
                .build();
    }
}
