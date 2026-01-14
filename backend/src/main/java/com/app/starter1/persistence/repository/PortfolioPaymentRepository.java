package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PortfolioPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioPaymentRepository extends JpaRepository<PortfolioPayment, Long> {
    List<PortfolioPayment> findByTenantId(Long tenantId);

    List<PortfolioPayment> findByTenantIdAndContactId(Long tenantId, Long contactId);
}
