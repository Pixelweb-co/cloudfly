package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    Optional<Plan> findByName(String name);

    List<Plan> findByIsActiveTrue();

    Optional<Plan> findByIsFreeAndIsActive(Boolean isFree, Boolean isActive);
}
