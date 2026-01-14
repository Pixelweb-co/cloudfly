package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PortfolioApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioApplicationRepository extends JpaRepository<PortfolioApplication, Long> {
    List<PortfolioApplication> findByPaymentId(Long paymentId);

    List<PortfolioApplication> findByDocumentId(Long documentId);
}
