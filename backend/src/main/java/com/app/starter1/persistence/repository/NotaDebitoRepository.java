package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.NotaDebito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotaDebitoRepository extends JpaRepository<NotaDebito, Long> {

    List<NotaDebito> findByTenantIdAndEstado(Long tenantId, NotaDebito.EstadoNotaDebito estado);

    List<NotaDebito> findByTenantIdOrderByFechaEmisionDesc(Long tenantId);

    List<NotaDebito> findByInvoiceIdReferencia(Long invoiceId);

    Optional<NotaDebito> findByNumeroNotaDebito(String numero);

    Optional<NotaDebito> findByCufe(String cufe);

    List<NotaDebito> findByTenantIdAndFechaEmisionBetween(Long tenantId, LocalDate fechaInicio, LocalDate fechaFin);

    boolean existsByNumeroNotaDebito(String numero);

    long countByTenantIdAndEstado(Long tenantId, NotaDebito.EstadoNotaDebito estado);
}
