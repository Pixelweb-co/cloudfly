package com.app.starter1.persistence.repository.rbac;

import com.app.starter1.persistence.entity.rbac.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RbacRoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByCode(String code);

    List<Role> findByIsActiveTrue();

    List<Role> findByTenantIdIsNullAndIsActiveTrue();

    List<Role> findByTenantIdAndIsActiveTrue(Integer tenantId);

    @Query("SELECT r FROM Role r WHERE r.tenantId IS NULL OR r.tenantId = :tenantId")
    List<Role> findAvailableRolesForTenant(@Param("tenantId") Integer tenantId);

    @Query("SELECT r FROM Role r " +
            "LEFT JOIN FETCH r.permissions rp " +
            "LEFT JOIN FETCH rp.moduleAction ma " +
            "LEFT JOIN FETCH ma.module m " +
            "WHERE r.code = :code")
    Optional<Role> findByCodeWithPermissions(@Param("code") String code);

    @Query("SELECT DISTINCT r FROM Role r " +
            "LEFT JOIN FETCH r.permissions rp " +
            "LEFT JOIN FETCH rp.moduleAction ma " +
            "LEFT JOIN FETCH ma.module m " +
            "WHERE r.code IN :codes")
    List<Role> findByCodesWithPermissions(@Param("codes") List<String> codes);

    boolean existsByCode(String code);
}
