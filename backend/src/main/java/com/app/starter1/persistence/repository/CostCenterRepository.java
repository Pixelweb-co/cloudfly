package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.CostCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CostCenterRepository extends JpaRepository<CostCenter, Long> {

    Optional<CostCenter> findByCode(String code);

    List<CostCenter> findByIsActiveTrueOrderByCodeAsc();

    List<CostCenter> findByParentIdIsNullAndIsActiveTrueOrderByCodeAsc();

    List<CostCenter> findByParentIdAndIsActiveTrueOrderByCodeAsc(Long parentId);

    boolean existsByCode(String code);
}
