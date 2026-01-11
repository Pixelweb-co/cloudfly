package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.CustomerConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository para CustomerConfig
 */
@Repository
public interface CustomerConfigRepository extends JpaRepository<CustomerConfig, Long> {

    /**
     * Buscar configuración por Customer
     */
    Optional<CustomerConfig> findByCustomer(Customer customer);

    /**
     * Buscar configuración por Customer ID
     */
    Optional<CustomerConfig> findByCustomerId(Long customerId);

    /**
     * Verificar si existe configuración para un Customer
     */
    boolean existsByCustomerId(Long customerId);

    /**
     * Eliminar configuración por Customer
     */
    void deleteByCustomer(Customer customer);
}
