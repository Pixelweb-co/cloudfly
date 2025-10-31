package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Checkeo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CheckeoRepository extends JpaRepository<Checkeo, Integer> {
    List<Checkeo> findByIdOrden(Long idOrden);
}