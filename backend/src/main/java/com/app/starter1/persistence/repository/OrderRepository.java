package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Buscar todas las órdenes de un tenant
    List<Order> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    // Buscar órdenes por tenant y rango de fechas
    @Query("SELECT o FROM Order o WHERE o.tenantId = :tenantId AND o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    List<Order> findByTenantIdAndDateRange(
            @Param("tenantId") Long tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Buscar por número de factura
    Optional<Order> findByInvoiceNumber(String invoiceNumber);

    // Buscar por tenant y estado
    List<Order> findByTenantIdAndStatusOrderByCreatedAtDesc(Long tenantId, String status);

    // Verificar si existe un número de factura (para evitar duplicados)
    boolean existsByInvoiceNumber(String invoiceNumber);

    // Contar órdenes de un tenant
    long countByTenantId(Long tenantId);

    // Obtener el último número de secuencia para generar invoice number
    @Query("SELECT MAX(o.id) FROM Order o WHERE o.tenantId = :tenantId")
    Long findMaxIdByTenantId(@Param("tenantId") Long tenantId);
}
