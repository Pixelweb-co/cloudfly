package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    List<Proveedor> findByTenantIdAndActivoTrue(Long tenantId);

    List<Proveedor> findByTenantId(Long tenantId);

    Optional<Proveedor> findByTenantIdAndNumeroDocumento(Long tenantId, String numeroDocumento);

    boolean existsByTenantIdAndNumeroDocumento(Long tenantId, String numeroDocumento);

    List<Proveedor> findByTenantIdAndRazonSocialContainingIgnoreCase(Long tenantId, String razonSocial);
}
