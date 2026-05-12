package com.app.persistence.repository;

import com.app.persistence.entity.Departamento;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface DepartamentoRepository extends ReactiveCrudRepository<Departamento, Long> {
    Flux<Departamento> findByEstadoTrueOrderByNombreAsc();
    Mono<Departamento> findByCodDane(String codDane);
}
