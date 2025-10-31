package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStatus(String status); // Filtrar productos por estado

    List<Product> findByProductNameContaining(String keyword); // Buscar productos por nombre parcial
    List<Product> findByCustomer(Long customerId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.image")
    List<Product> findAllWithImage();
}