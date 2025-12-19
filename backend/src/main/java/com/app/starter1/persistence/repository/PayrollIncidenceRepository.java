package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollIncidence;
import com.app.starter1.persistence.entity.PayrollPeriod;
import com.app.starter1.persistence.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PayrollIncidenceRepository extends JpaRepository<PayrollIncidence, Long> {

    List<PayrollIncidence> findByPayrollPeriod(PayrollPeriod payrollPeriod);

    List<PayrollIncidence> findByEmployee(Employee employee);

    List<PayrollIncidence> findByPayrollPeriodAndEmployee(PayrollPeriod payrollPeriod, Employee employee);

    List<PayrollIncidence> findByPayrollPeriodAndIncidenceType(
            PayrollPeriod payrollPeriod, PayrollIncidence.IncidenceType incidenceType);
}
