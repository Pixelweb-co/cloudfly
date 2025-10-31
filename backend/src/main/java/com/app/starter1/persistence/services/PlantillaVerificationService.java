package com.app.starter1.persistence.services;


import com.app.starter1.dto.PlantillaVRequest;
import com.app.starter1.persistence.entity.PlantillaVerificacion;

import com.app.starter1.persistence.repository.PlantillaVerificationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PlantillaVerificationService {

    @Autowired
    private PlantillaVerificationRepository plantillaVerificationRepository;

    // Obtener todas las plantillas
    public List<PlantillaVerificacion> obtenerTodasLasPlantillaVerificacions() {
        return plantillaVerificationRepository.findAll();
    }

    // Obtener una plantilla por su ID
    public Optional<PlantillaVerificacion> obtenerPlantillaVerificacionPorId(Long id) {
        return plantillaVerificationRepository.findById(id);
    }

    // Crear o actualizar una plantilla
    public PlantillaVerificacion guardarPlantillaVerificacion(PlantillaVRequest plantilla) {

        PlantillaVerificacion plantillaVerificacion = new PlantillaVerificacion();

        plantillaVerificacion.setTemplateName(plantilla.getTemplateName());
        plantillaVerificacion.setEquimentlist(plantilla.getEquimentlist());

        return plantillaVerificationRepository.save(plantillaVerificacion);



    }

    // Eliminar una plantilla por su ID
    public void eliminarPlantillaVerificacion(Long id) {
        plantillaVerificationRepository.deleteById(id);
    }


    //obtener plantillas para reporte
    public List<PlantillaVerificacion> obtenerPlantillaVerificacionsReporte(Long idProducto) {
        System.out.println(idProducto);
        return plantillaVerificationRepository.findAll();

    }

}
