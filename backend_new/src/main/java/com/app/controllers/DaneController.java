package com.app.controllers;

import com.app.persistence.entity.Ciudad;
import com.app.persistence.entity.Departamento;
import com.app.services.DaneService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/settings/dane")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DaneController {

    private final DaneService daneService;

    @GetMapping("/departamentos")
    public Flux<Departamento> getDepartamentos() {
        return daneService.getDepartamentos();
    }

    @GetMapping("/ciudades/{codigoDepartamento}")
    public Flux<Ciudad> getCiudadesByDepartamento(@PathVariable String codigoDepartamento) {
        return daneService.getCiudadesByDepartamento(codigoDepartamento);
    }

    @GetMapping("/codigo/{codigo}")
    public Mono<Object> getByCodigo(@PathVariable String codigo) {
        return daneService.getByCodigo(codigo);
    }
}
