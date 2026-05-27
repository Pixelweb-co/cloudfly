package com.app.starter1.persistence.repository.rbac;

import com.app.starter1.persistence.entity.rbac.ModuleAction;
import com.app.starter1.persistence.entity.rbac.Role;
import com.app.starter1.persistence.entity.rbac.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModuleActionRepository extends JpaRepository<ModuleAction, Long> {

        List<ModuleAction> findByModuleId(Long moduleId);

        Optional<ModuleAction> findByModuleCodeAndCode(String moduleCode, String actionCode);

        @Query("SELECT ma FROM ModuleAction ma " +
                        "JOIN ma.module m " +
                        "WHERE m.code = :moduleCode")
        List<ModuleAction> findByModuleCode(@Param("moduleCode") String moduleCode);

        @Query("SELECT ma FROM ModuleAction ma " +
                        "JOIN RolePermission rp ON rp.moduleAction = ma " +
                        "JOIN Role r ON rp.role = r " +
                        "WHERE r.code IN :roleCodes " +
                        "AND rp.granted = true")
        List<ModuleAction> findGrantedActionsByRoleCodes(@Param("roleCodes") List<String> roleCodes);
}
