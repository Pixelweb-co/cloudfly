package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.AccountingLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountingLedgerRepository extends JpaRepository<AccountingLedger, Long> {
    Optional<AccountingLedger> findByTenantIdAndFiscalPeriodIdAndAccountCode(Integer tenantId, Long fiscalPeriodId,
            String accountCode);

    List<AccountingLedger> findByTenantIdAndFiscalPeriodId(Integer tenantId, Long fiscalPeriodId);
}
