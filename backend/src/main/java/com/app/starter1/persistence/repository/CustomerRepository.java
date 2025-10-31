package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Customer;
import java.util.Optional;

import com.app.starter1.persistence.entity.TypeDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findUserEntityByEmail(String email);
    List<Customer> findByStatus(Boolean status); // Filtrar clientes por estado
    List<Customer> findByNameContaining(String keyword); // Buscar clientes por nombre parcial

}