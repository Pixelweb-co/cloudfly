package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.PayrollConfiguration;
import com.app.starter1.persistence.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PayrollConfigurationRepository extends JpaRepository<PayrollConfiguration, Long> {

    Optional<PayrollConfiguration> findByCustomer(Customer customer);
}
