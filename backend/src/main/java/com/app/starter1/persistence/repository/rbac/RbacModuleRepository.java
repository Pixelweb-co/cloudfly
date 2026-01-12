package com.app.starter1.persistence.repository.rbac;

import com.app.starter1.persistence.entity.rbac.RbacModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RbacModuleRepository extends JpaRepository<RbacModule, Long> {

        Optional<RbacModule> findByCode(String code);

        boolean existsByCode(String code);

        List<RbacModule> findByIsActiveTrueOrderByDisplayOrderAsc();

        // Alias para compatibilidad
        default List<RbacModule> findAllByIsActiveTrueOrderByDisplayOrder() {
                return findByIsActiveTrueOrderByDisplayOrderAsc();
        }

        @Query("SELECT DISTINCT m FROM RbacModule m " +
                        "JOIN m.actions ma " +
                        "JOIN RolePermission rp ON rp.moduleAction = ma " +
                        "JOIN Role r ON rp.role = r " +
                        "WHERE r.code IN :roleCodes " +
                        "AND rp.granted = true " +
                        "AND m.isActive = true " +
                        "ORDER BY m.displayOrder ASC")
        List<RbacModule> findModulesByRoleCodes(@Param("roleCodes") List<String> roleCodes);

        @Query("SELECT DISTINCT m FROM RbacModule m " +
                        "JOIN FETCH m.actions ma " +
                        "WHERE m.isActive = true " +
                        "ORDER BY m.displayOrder ASC")
        List<RbacModule> findAllWithActions();
}
