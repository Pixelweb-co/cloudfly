package com.app.starter1.controllers;


import com.app.starter1.dto.PlantillaVRequest;

import com.app.starter1.dto.PlantillaVerificationDTO;
import com.app.starter1.persistence.entity.PlantillaVerificacion;
import com.app.starter1.persistence.entity.PlantillaVerificacionData;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.entity.TypeDevice;
import com.app.starter1.persistence.repository.PlantillaVerificationRepository;
import com.app.starter1.persistence.repository.TypeDeviceRepository;
import com.app.starter1.persistence.repository.VerificationRepository;
import com.app.starter1.persistence.services.PlantillaVerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/plantillas-verificacion")
public class PlantillaVerificationController {

    @Autowired
    private PlantillaVerificationService plantillaVerificationService;

    @Autowired
    PlantillaVerificationRepository plantillaVerificationRepository;

    @Autowired
    TypeDeviceRepository typeDeviceRepository;

    @Autowired
    VerificationRepository verificationRepository;


    @GetMapping("/device/{idTypeDevice}")
    public ResponseEntity<PlantillaVerificacion> obtenerPlantillaDevice(@PathVariable Long idTypeDevice) {

        Optional<TypeDevice> tipoDisp = typeDeviceRepository.findById(idTypeDevice);

        Optional<PlantillaVerificacion> plantillaVerificacionD = plantillaVerificationRepository.findById(Long.valueOf(tipoDisp.get().getPlantillaVerificacion()));

        return plantillaVerificacionD.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/data/{plantilla_id}")
    public ResponseEntity<List<PlantillaVerificacionData>> obtenerDatosPlantilla(@PathVariable("plantilla_id") String plantillaId) {
        List<PlantillaVerificacionData> plData = verificationRepository.findByIdPlantilla(plantillaId);

        if (plData.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(plData);
    }


    // Obtener todas las plantillas filtradas por marca, modelo y tipoElement
    @GetMapping
    public List<PlantillaVerificacion> obtenerTodasLasPlantillas() {

        return plantillaVerificationRepository.findAll();
    }
    // Crear o actualizar una plantilla
    @PostMapping
    public ResponseEntity<PlantillaVerificacion> guardarPlantillas(@RequestBody PlantillaVRequest plantillaRequest) {
        // Procesar la lista de campos en el servicio
       PlantillaVerificacion plantillasGuardada =  plantillaVerificationService.guardarPlantillaVerificacion(plantillaRequest);
        return new ResponseEntity<>(plantillasGuardada, HttpStatus.CREATED);
    }

    // Eliminar plantilla por ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPlantilla(@PathVariable Long id) {
        plantillaVerificationService.eliminarPlantillaVerificacion(id);
        return ResponseEntity.noContent().build();
    }
}
