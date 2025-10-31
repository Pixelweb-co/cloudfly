package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PermissionEntity;
import org.springframework.data.repository.CrudRepository;

public interface PermissionRepository extends CrudRepository<PermissionEntity, Long> {
}
