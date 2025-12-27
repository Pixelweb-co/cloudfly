package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.entity.Channel.ChannelType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChannelRepository extends JpaRepository<Channel, Long> {

    List<Channel> findByCustomerId(Long customerId);

    List<Channel> findByCustomerIdAndIsActive(Long customerId, Boolean isActive);

    Optional<Channel> findByCustomerIdAndType(Long customerId, ChannelType type);

    boolean existsByCustomerIdAndType(Long customerId, ChannelType type);
}
