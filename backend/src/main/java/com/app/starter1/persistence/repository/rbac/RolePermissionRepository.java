package com.app.starter1.persistence.repository.rbac;

import com.app.starter1.persistence.entity.rbac.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    List<RolePermission> findByRoleId(Long roleId);

    List<RolePermission> findByRoleIdAndGrantedTrue(Long roleId);

    @Query("SELECT rp FROM RolePermission rp " +
            "JOIN FETCH rp.moduleAction ma " +
            "JOIN FETCH ma.module m " +
            "WHERE rp.role.code IN :roleCodes " +
            "AND rp.granted = true")
    List<RolePermission> findGrantedPermissionsByRoleCodes(@Param("roleCodes") List<String> roleCodes);

    @Query("SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END " +
            "FROM RolePermission rp " +
            "JOIN rp.moduleAction ma " +
            "JOIN ma.module m " +
            "WHERE rp.role.code IN :roleCodes " +
            "AND m.code = :moduleCode " +
            "AND ma.code = :actionCode " +
            "AND rp.granted = true")
    boolean hasPermission(
            @Param("roleCodes") List<String> roleCodes,
            @Param("moduleCode") String moduleCode,
            @Param("actionCode") String actionCode);

    @Modifying
    @Transactional
    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId")
    void deleteAllByRoleId(@Param("roleId") Long roleId);

    boolean existsByRoleIdAndModuleActionId(Long roleId, Long moduleActionId);
}
