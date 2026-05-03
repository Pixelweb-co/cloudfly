package com.marketing.worker.persistence.repository;

import com.marketing.worker.persistence.entity.ChannelConfig;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChannelConfigRepository extends ReactiveCrudRepository<ChannelConfig, Long> {
}
