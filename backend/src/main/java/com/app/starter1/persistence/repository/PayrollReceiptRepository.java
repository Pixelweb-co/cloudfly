package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollReceipt;
import com.app.starter1.persistence.entity.PayrollPeriod;
import com.app.starter1.persistence.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollReceiptRepository extends JpaRepository<PayrollReceipt, Long> {

    List<PayrollReceipt> findByPayrollPeriod(PayrollPeriod payrollPeriod);

    Optional<PayrollReceipt> findByPayrollPeriodAndEmployee(PayrollPeriod payrollPeriod, Employee employee);

    List<PayrollReceipt> findByEmployee(Employee employee);

    Optional<PayrollReceipt> findByReceiptNumber(String receiptNumber);

    @Query("SELECT COUNT(r) FROM PayrollReceipt r WHERE r.payrollPeriod = :period AND r.status = :status")
    long countByPayrollPeriodAndStatus(PayrollPeriod period, PayrollReceipt.ReceiptStatus status);
}
