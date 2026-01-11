package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollDevengado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollDevengadoRepository extends JpaRepository<PayrollDevengado, Long> {
    List<PayrollDevengado> findByPayrollReceiptId(Long payrollReceiptId);
}
