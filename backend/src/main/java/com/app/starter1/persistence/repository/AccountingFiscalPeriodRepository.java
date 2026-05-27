package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.AccountingFiscalPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountingFiscalPeriodRepository extends JpaRepository<AccountingFiscalPeriod, Long> {
    Optional<AccountingFiscalPeriod> findByTenantIdAndYearAndMonth(Integer tenantId, Integer year, Integer month);

    boolean existsByTenantIdAndYearAndMonth(Integer tenantId, Integer year, Integer month);
}
