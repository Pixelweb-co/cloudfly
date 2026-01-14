package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PortfolioDocument;
import com.app.starter1.persistence.entity.PortfolioStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PortfolioDocumentRepository extends JpaRepository<PortfolioDocument, Long> {

    List<PortfolioDocument> findByTenantId(Long tenantId);

    // Buscar por cliente y estado (ej. Solo pendientes)
    List<PortfolioDocument> findByTenantIdAndContactIdAndStatusIn(Long tenantId, Long contactId,
            List<PortfolioStatus> statuses);

    // Para paginación
    Page<PortfolioDocument> findByTenantId(Long tenantId, Pageable pageable);

    // Buscar documento por origen (para evitar duplicados al crear desde Factura)
    Optional<PortfolioDocument> findByTenantIdAndDocumentSourceAndDocumentNumber(Long tenantId, String source,
            String number);

    // Aging Report Query (Ejemplo simplificado)
    @Query("SELECT pd FROM PortfolioDocument pd WHERE pd.tenantId = :tenantId AND pd.balance > 0")
    List<PortfolioDocument> findOpenDocuments(@Param("tenantId") Long tenantId);

    @Query("SELECT SUM(pd.balance) FROM PortfolioDocument pd WHERE pd.tenantId = :tenantId AND pd.type = 'RECEIVABLE'")
    BigDecimal getTotalReceivable(@Param("tenantId") Long tenantId);

    @Query("SELECT SUM(pd.balance) FROM PortfolioDocument pd WHERE pd.tenantId = :tenantId AND pd.type = 'PAYABLE'")
    BigDecimal getTotalPayable(@Param("tenantId") Long tenantId);
}
