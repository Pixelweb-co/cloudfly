package com.app.persistence.repository;

import com.app.persistence.entity.PermissionEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface PermissionRepository extends ReactiveCrudRepository<PermissionEntity, Long> {

    @Query("SELECT p.* FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = :roleId")
    Flux<PermissionEntity> findPermissionsByRoleId(Long roleId);
}
