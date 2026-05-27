package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.ChartOfAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChartOfAccountRepository extends JpaRepository<ChartOfAccount, Long> {

    Optional<ChartOfAccount> findByCode(String code);

    List<ChartOfAccount> findByAccountType(String accountType);

    List<ChartOfAccount> findByLevel(Integer level);

    List<ChartOfAccount> findByParentCode(String parentCode);

    List<ChartOfAccount> findByIsActiveTrue();

    List<ChartOfAccount> findByIsActiveTrueOrderByCodeAsc();

    List<ChartOfAccount> findByLevelAndIsActiveTrueOrderByCodeAsc(Integer level);

    List<ChartOfAccount> findByAccountTypeAndIsActiveTrueOrderByCodeAsc(String accountType);

    boolean existsByCode(String code);
}
