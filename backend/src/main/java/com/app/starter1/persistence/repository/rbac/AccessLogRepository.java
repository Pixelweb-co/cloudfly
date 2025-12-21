package com.app.starter1.persistence.repository.rbac;

import com.app.starter1.persistence.entity.rbac.AccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    Page<AccessLog> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<AccessLog> findByTenantIdOrderByCreatedAtDesc(Integer tenantId, Pageable pageable);

    @Query("SELECT al FROM AccessLog al " +
            "WHERE al.createdAt BETWEEN :startDate AND :endDate " +
            "ORDER BY al.createdAt DESC")
    Page<AccessLog> findByDateRange(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    @Query("SELECT al FROM AccessLog al " +
            "WHERE al.userId = :userId " +
            "AND al.moduleCode = :moduleCode " +
            "ORDER BY al.createdAt DESC")
    List<AccessLog> findByUserAndModule(
            @Param("userId") Long userId,
            @Param("moduleCode") String moduleCode);

    @Query("SELECT al.moduleCode, COUNT(al) FROM AccessLog al " +
            "WHERE al.tenantId = :tenantId " +
            "AND al.createdAt >= :since " +
            "GROUP BY al.moduleCode " +
            "ORDER BY COUNT(al) DESC")
    List<Object[]> getModuleUsageStats(
            @Param("tenantId") Integer tenantId,
            @Param("since") LocalDateTime since);

    long countBySuccessFalseAndCreatedAtAfter(LocalDateTime since);
}
