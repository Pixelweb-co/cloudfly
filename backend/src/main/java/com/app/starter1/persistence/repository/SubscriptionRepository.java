package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Subscription;
import com.app.starter1.persistence.entity.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserIdAndStatus(Long userId, SubscriptionStatus status);
    List<Subscription> findByUserId(Long userId);
    List<Subscription> findByStatus(SubscriptionStatus status);
}
