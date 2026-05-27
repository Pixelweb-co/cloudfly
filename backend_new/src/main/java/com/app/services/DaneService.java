package com.app.services;

import com.app.persistence.entity.Ciudad;
import com.app.persistence.entity.Departamento;
import com.app.persistence.repository.CiudadRepository;
import com.app.persistence.repository.DepartamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class DaneService {

    private final DepartamentoRepository departamentoRepository;
    private final CiudadRepository ciudadRepository;

    public Flux<Departamento> getDepartamentos() {
        return departamentoRepository.findByEstadoTrueOrderByNombreAsc();
    }

    public Flux<Ciudad> getCiudadesByDepartamento(String departamentoCod) {
        return ciudadRepository.findByDepartamentoCodAndEstadoTrueOrderByNombreAsc(departamentoCod);
    }

    public Mono<Object> getByCodigo(String codigo) {
        // If length is 2, it's a department, if 5 it's a city (standard DANE)
        if (codigo.length() <= 2) {
            return departamentoRepository.findByCodDane(codigo).cast(Object.class);
        } else {
            return ciudadRepository.findByCodDane(codigo).cast(Object.class);
        }
    }
}
