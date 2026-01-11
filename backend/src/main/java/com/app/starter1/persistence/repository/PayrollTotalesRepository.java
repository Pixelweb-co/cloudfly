package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollTotales;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayrollTotalesRepository extends JpaRepository<PayrollTotales, Long> {
    Optional<PayrollTotales> findByPayrollReceiptId(Long payrollReceiptId);
}
