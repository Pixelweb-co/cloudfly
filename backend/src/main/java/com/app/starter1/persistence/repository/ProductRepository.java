package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByTenantId(Long tenantId);

    Optional<Product> findByIdAndTenantId(Long id, Long tenantId);

    // POS: Búsqueda por código de barras
    Optional<Product> findByBarcodeAndTenantId(String barcode, Long tenantId);

    // POS: Búsqueda por nombre (autocompletado)
    List<Product> findByProductNameContainingIgnoreCaseAndTenantId(String productName, Long tenantId);
}
