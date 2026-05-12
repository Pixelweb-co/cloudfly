package com.app.persistence.repository;

import com.app.persistence.entity.Ciudad;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface CiudadRepository extends ReactiveCrudRepository<Ciudad, Long> {
    Flux<Ciudad> findByDepartamentoCodAndEstadoTrueOrderByNombreAsc(String departamentoCod);
    Mono<Ciudad> findByCodDane(String codDane);
}
