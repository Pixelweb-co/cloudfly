package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.NotaCredito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotaCreditoRepository extends JpaRepository<NotaCredito, Long> {

    List<NotaCredito> findByTenantIdAndEstado(Long tenantId, NotaCredito.EstadoNotaCredito estado);

    List<NotaCredito> findByTenantIdOrderByFechaEmisionDesc(Long tenantId);

    List<NotaCredito> findByInvoiceIdReferencia(Long invoiceId);

    Optional<NotaCredito> findByNumeroNotaCredito(String numero);

    Optional<NotaCredito> findByCufe(String cufe);

    List<NotaCredito> findByTenantIdAndFechaEmisionBetween(Long tenantId, LocalDate fechaIniciofinal,
            LocalDate fechaFin);

    boolean existsByNumeroNotaCredito(String numero);

    long countByTenantIdAndEstado(Long tenantId, NotaCredito.EstadoNotaCredito estado);
}
