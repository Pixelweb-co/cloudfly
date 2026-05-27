package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.EmployeePayrollConcept;
import com.app.starter1.persistence.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeePayrollConceptRepository extends JpaRepository<EmployeePayrollConcept, Long> {

    List<EmployeePayrollConcept> findByEmployeeAndIsActiveTrue(Employee employee);

    @Query("SELECT epc FROM EmployeePayrollConcept epc WHERE epc.employee = :employee AND " +
            "epc.isActive = true AND epc.startDate <= :date AND " +
            "(epc.endDate IS NULL OR epc.endDate >= :date)")
    List<EmployeePayrollConcept> findValidConceptsForEmployeeOnDate(
            @Param("employee") Employee employee, @Param("date") LocalDate date);
}
