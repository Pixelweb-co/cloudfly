package com.app.persistence.repository;

import com.app.persistence.entity.OrderEntity;
import java.time.LocalDateTime;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface OrderRepository extends ReactiveCrudRepository<OrderEntity, Long> {
    @Query("SELECT * FROM orders WHERE tenant_id = :tenantId")
    Flux<OrderEntity> findAllByTenantId(Long tenantId);
    Flux<OrderEntity> findAllByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM orders WHERE order_number = :orderNumber AND tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Mono<OrderEntity> findByOrderNumberAndTenantId(String orderNumber, Long tenantId, Long companyId);

    @Query("SELECT * FROM orders WHERE customer_id = :customerId AND tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Flux<OrderEntity> findByCustomerIdAndTenantId(Long customerId, Long tenantId, Long companyId);

    @Query("SELECT COUNT(*) FROM orders WHERE tenant_id = :tenantId")
    Mono<Integer> countByTenantId(Long tenantId);

    @Query("SELECT COUNT(*) FROM orders WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Mono<Integer> countByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT COALESCE(SUM(total), 0) FROM orders WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId)")
    Mono<Double> sumTotalByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT DATE(created_at) as date, SUM(total) as total, COUNT(*) as count FROM orders WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) AND created_at >= :since GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC")
    Flux<com.app.dto.SalesHistoryDTO> getSalesHistory(Long tenantId, Long companyId, LocalDateTime since);

    @Query("SELECT * FROM orders WHERE tenant_id = :tenantId AND (:companyId IS NULL OR company_id = :companyId) ORDER BY created_at DESC LIMIT 5")
    Flux<OrderEntity> findRecentOrders(Long tenantId, Long companyId);
}
