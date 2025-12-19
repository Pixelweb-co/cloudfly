package com.app.starter1.persistence.repos;

import com.app.starter1.persistence.entity.PayrollNovelty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PayrollNoveltyRepository extends JpaRepository<PayrollNovelty, Long> {

    @Query("SELECT n FROM PayrollNovelty n JOIN FETCH n.employee LEFT JOIN FETCH n.payrollPeriod WHERE n.customer.id = :customerId")
    Page<PayrollNovelty> findByCustomerId(@Param("customerId") Long customerId, Pageable pageable);

    @Query("SELECT n FROM PayrollNovelty n WHERE n.customer.id = :customerId AND n.status = 'PENDING'")
    List<PayrollNovelty> findPendingByCustomer(@Param("customerId") Long customerId);

    @Query("SELECT n FROM PayrollNovelty n WHERE n.customer.id = :customerId AND n.payrollPeriod.id = :periodId")
    List<PayrollNovelty> findByPeriod(@Param("customerId") Long customerId, @Param("periodId") Long periodId);

    @Query("SELECT n FROM PayrollNovelty n WHERE n.customer.id = :customerId AND n.employee.id = :employeeId")
    List<PayrollNovelty> findByEmployee(@Param("customerId") Long customerId, @Param("employeeId") Long employeeId);
}
