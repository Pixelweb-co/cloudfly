package com.app.starter1.services;

import com.app.starter1.dto.hr.PayrollPeriodDTO;
import com.app.starter1.persistence.entity.PayrollPeriod;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.PayrollPeriodRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollPeriodService {

        private final PayrollPeriodRepository periodRepository;
        private final CustomerRepository customerRepository;

        @Transactional(readOnly = true)
        public Page<PayrollPeriodDTO> getAllPeriods(Long customerId, Pageable pageable) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                return periodRepository.findByCustomerOrderByYearDescPeriodNumberDesc(customer, pageable)
                                .map(this::convertToDTO);
        }

        @Transactional
        public PayrollPeriodDTO createPeriod(PayrollPeriodDTO dto, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
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
                                .build();

                period = periodRepository.save(period);
                log.info("Created period: {}", period.getPeriodName());

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

        private PayrollPeriodDTO convertToDTO(PayrollPeriod period) {
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
                                .build();
        }
}
