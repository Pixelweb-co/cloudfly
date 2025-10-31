package com.app.starter1.persistence.services;

import com.app.starter1.dto.PlantillaRequest;
import com.app.starter1.persistence.entity.Plantilla;
import com.app.starter1.persistence.repository.PlantillaRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PlantillaService {

    @Autowired
    private PlantillaRepository plantillaRepository;

    // Obtener todas las plantillas
    public List<Plantilla> obtenerTodasLasPlantillas() {
        return plantillaRepository.findAll();
    }

    // Obtener una plantilla por su ID
    public Optional<Plantilla> obtenerPlantillaPorId(Long id) {
        return plantillaRepository.findById(id);
    }

    // Crear o actualizar una plantilla
    public Plantilla guardarPlantilla(Plantilla plantilla) {
        return plantillaRepository.save(plantilla);
    }

    // Eliminar una plantilla por su ID
    public void eliminarPlantilla(Long id) {
        plantillaRepository.deleteById(id);
    }

    // Obtener todas las plantillas con filtros
    public List<Plantilla> obtenerPlantillasFiltradas(String marca, String modelo, Long tipoElement) {
        return plantillaRepository.findByMarcaAndModeloAndTipoElement(marca,modelo,tipoElement);

    }
    //obtener plantillas para reporte
    public List<Plantilla> obtenerPlantillasReporte(Long idProducto) {
        System.out.println(idProducto);
        return plantillaRepository.findPlantillasByProductoId(idProducto);

    }

    @Transactional
    public List<Plantilla> guardarPlantillas(PlantillaRequest plantillaRequest) {
        // Eliminar plantillas existentes por marca, modelo y tipoElement
        plantillaRepository.deleteByMarcaAndModeloAndTipoElement(
                plantillaRequest.getMarca(),
                plantillaRequest.getModelo(),
                plantillaRequest.getTipoElement()
        );

        // Guardar nuevas plantillas
        List<Plantilla> plantillas = new ArrayList<>();
        for (PlantillaRequest.Campo campo : plantillaRequest.getCampos()) {
            Plantilla plantilla = Plantilla.builder()
                    .marca(plantillaRequest.getMarca())
                    .modelo(plantillaRequest.getModelo())
                    .tipoElement(plantillaRequest.getTipoElement())
                    .nom(campo.getNom())
                    .tipo(campo.getTipo())
                    .dateTime(LocalDateTime.now())
                    .build();

            plantillas.add(plantillaRepository.save(plantilla));
        }

        return plantillas;
    }

}
