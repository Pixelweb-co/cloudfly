package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollConcept;
import com.app.starter1.persistence.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollConceptRepository extends JpaRepository<PayrollConcept, Long> {

    List<PayrollConcept> findByCustomerAndIsActiveTrueAndDeletedAtIsNull(Customer customer);

    List<PayrollConcept> findByCustomerAndConceptTypeAndIsActiveTrueAndDeletedAtIsNull(
            Customer customer, PayrollConcept.ConceptType conceptType);

    Optional<PayrollConcept> findByIdAndCustomer(Long id, Customer customer);

    Optional<PayrollConcept> findByCodeAndCustomer(String code, Customer customer);

    boolean existsByCodeAndCustomer(String code, Customer customer);
}
