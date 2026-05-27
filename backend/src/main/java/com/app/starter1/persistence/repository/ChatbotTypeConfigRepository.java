package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.ChatbotTypeConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatbotTypeConfigRepository extends JpaRepository<ChatbotTypeConfig, Long> {

    List<ChatbotTypeConfig> findByStatus(Boolean status);

    Optional<ChatbotTypeConfig> findByTypeName(String typeName);
}
