package com.app.starter1.controllers;

import com.app.starter1.persistence.entity.Checkeo;
import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.repository.CheckeoRepository;
import com.app.starter1.persistence.repository.ContratoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/checkeo")
public class CheckeoController {

    @Autowired
    private CheckeoRepository checkeoRepository;

    @GetMapping("/{id_orden}")
    public ResponseEntity<List<Checkeo>> getTbckeckeo(@PathVariable Long id_orden){



        List<Checkeo> tabla = checkeoRepository.findByIdOrden(id_orden);

        return ResponseEntity.ok(tabla);

    }

    
}
