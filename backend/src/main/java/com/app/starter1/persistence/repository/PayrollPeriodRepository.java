package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollPeriod;
import com.app.starter1.persistence.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollPeriodRepository extends JpaRepository<PayrollPeriod, Long> {

    Page<PayrollPeriod> findByCustomerOrderByYearDescPeriodNumberDesc(Customer customer, Pageable pageable);

    List<PayrollPeriod> findByCustomerAndYearOrderByPeriodNumberDesc(Customer customer, Integer year);

    Optional<PayrollPeriod> findByIdAndCustomer(Long id, Customer customer);

    Optional<PayrollPeriod> findByCustomerAndYearAndPeriodNumber(
            Customer customer, Integer year, Integer periodNumber);

    List<PayrollPeriod> findByCustomerAndStatus(Customer customer, PayrollPeriod.PeriodStatus status);
}
