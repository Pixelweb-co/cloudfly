package com.app.persistence.repository;

import com.app.persistence.entity.Media;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface MediaRepository extends ReactiveCrudRepository<Media, Long> {
    Flux<Media> findAllByTenantId(Long tenantId);
    Flux<Media> findAllByTenantIdAndFilenameContainingIgnoreCase(Long tenantId, String filename);
}
