package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Quote;
import com.app.starter1.persistence.entity.QuoteStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Long> {

    List<Quote> findByTenantId(Long tenantId);

    Page<Quote> findByTenantId(Long tenantId, Pageable pageable);

    Optional<Quote> findByQuoteNumberAndTenantId(String quoteNumber, Long tenantId);

    List<Quote> findByTenantIdAndStatus(Long tenantId, QuoteStatus status);

    List<Quote> findByTenantIdAndCustomerId(Long tenantId, Long customerId);

    List<Quote> findByTenantIdAndQuoteDateBetween(Long tenantId, LocalDateTime startDate, LocalDateTime endDate);
}
