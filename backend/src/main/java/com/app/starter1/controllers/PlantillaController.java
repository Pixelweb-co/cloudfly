package com.app.starter1.controllers;

import com.app.starter1.dto.PlantillaProductoResponse;
import com.app.starter1.dto.PlantillaRequest;
import com.app.starter1.persistence.entity.Plantilla;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.repository.ProductRepository;
import com.app.starter1.persistence.services.PlantillaService;
import com.app.starter1.persistence.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/plantillas")
public class PlantillaController {

    @Autowired
    private PlantillaService plantillaService;


    @Autowired
    private ProductRepository productRepository;

    // Obtener todas las plantillas filtradas por marca, modelo y tipoElement
    @GetMapping
    public List<Plantilla> obtenerTodasLasPlantillas(
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String modelo,
            @RequestParam(required = false) String tipoElement) {
        Long tipo = null;

        if (tipoElement != null) {
            tipo = Long.parseLong(tipoElement);  // Convertir tipoElement a Long si no es nulo
        }

        System.out.println(tipo);


        return plantillaService.obtenerPlantillasFiltradas(marca, modelo, tipo);
    }

    // Obtener todas las plantillas filtradas por marca, modelo y tipoElement
    @GetMapping("/producto/{id}")
    public ResponseEntity<PlantillaProductoResponse>  obtenerTodasLasPlantillasSolicitud(
            @PathVariable Long id)
            {

        List<Plantilla> plantillas = plantillaService.obtenerPlantillasReporte(id);
        Optional<Product> producto = productRepository.findById(id);

        if (producto.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Product productog = producto.get();
        // Construir la respuesta
        PlantillaProductoResponse response = new PlantillaProductoResponse(productog, plantillas);

        return ResponseEntity.ok(response);

    }

    // Crear o actualizar una plantilla
    @PostMapping
    public ResponseEntity<List<Plantilla>> guardarPlantillas(@RequestBody PlantillaRequest plantillaRequest) {
        // Procesar la lista de campos en el servicio
        List<Plantilla> plantillasGuardadas = plantillaService.guardarPlantillas(plantillaRequest);
        return new ResponseEntity<>(plantillasGuardadas, HttpStatus.CREATED);
    }

    // Eliminar plantilla por ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarPlantilla(@PathVariable Long id) {
        plantillaService.eliminarPlantilla(id);
        return ResponseEntity.noContent().build();
    }
}
