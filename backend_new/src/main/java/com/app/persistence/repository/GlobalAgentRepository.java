package com.app.persistence.repository;

import com.app.persistence.entity.GlobalAgent;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface GlobalAgentRepository extends ReactiveCrudRepository<GlobalAgent, Long> {
    Flux<GlobalAgent> findByIsActiveTrue();
}
