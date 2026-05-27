package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.ChatbotConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatbotConfigRepository extends JpaRepository<ChatbotConfig, Long> {
    Optional<ChatbotConfig> findByTenantId(Long tenantId);

    Optional<ChatbotConfig> findByTenantIdAndIsActive(Long tenantId, Boolean isActive);

    Optional<ChatbotConfig> findByInstanceName(String instanceName);
}
