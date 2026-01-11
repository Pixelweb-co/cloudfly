package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollDeduccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollDeduccionRepository extends JpaRepository<PayrollDeduccion, Long> {
    List<PayrollDeduccion> findByPayrollReceiptId(Long payrollReceiptId);
}
