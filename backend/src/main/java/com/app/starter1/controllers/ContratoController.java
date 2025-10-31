package com.app.starter1.controllers;

import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.repository.ContratoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
public class ContratoController {

    @Autowired
    private ContratoRepository contratoRepository;

    // Endpoint para obtener un contrato por el id del cliente
    @GetMapping("/contratos/customer/{customerId}")
    public ResponseEntity<Contrato> getContratoByCustomerId(@PathVariable Long customerId) {
        Optional<Contrato> contrato = contratoRepository.findByClienteId(customerId);

        return contrato.map(ResponseEntity::ok)  // Si existe el contrato, lo devuelve con un estado 200 OK
                .orElseGet(() -> ResponseEntity.notFound().build());  // Si no, devuelve 404 Not Found
    }

    
}
