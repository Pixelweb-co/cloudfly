package com.app.starter1.controllers;

import com.app.starter1.dto.TypeServiceDTO;
import com.app.starter1.persistence.entity.TipoServicio;
import com.app.starter1.persistence.services.TypeServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/type-service")
public class TypeServiceController {

    @Autowired
    private TypeServiceService typeServiceService;

    // Obtener todos los typeServiceos
    @GetMapping
    public ResponseEntity<List<TypeServiceDTO>> getAllTypeServices() {
        List<TypeServiceDTO> typeServices = typeServiceService.findAll();
        return ResponseEntity.ok(typeServices);
    }

    // Obtener typeServiceo por ID
    @GetMapping("/{id}")
    public ResponseEntity<TypeServiceDTO> getTypeServiceById(@PathVariable Long id) {
        TypeServiceDTO typeService = typeServiceService.findById(id);
        return ResponseEntity.ok(typeService);
    }

    // Crear un nuevo typeServiceo
    @PostMapping
    public ResponseEntity<TypeServiceDTO> createTypeService(@RequestBody TypeServiceDTO typeServiceDTO) {
        TipoServicio typeService = typeServiceService.mapToEntity(typeServiceDTO);
        TipoServicio savedTypeService = typeServiceService.save(typeService);
        return ResponseEntity.ok(typeServiceService.mapToDTO(savedTypeService));
    }

    // Actualizar un typeServiceo existente
    @PutMapping("/{id}")
    public ResponseEntity<TypeServiceDTO> updateTypeService(@PathVariable Long id, @RequestBody TypeServiceDTO typeServiceDTO) {
        TipoServicio existingTypeService = typeServiceService.findEntityById(id);
        typeServiceService.updateEntityFromDTO(existingTypeService, typeServiceDTO);
        TipoServicio updatedTypeService = typeServiceService.save(existingTypeService);
        return ResponseEntity.ok(typeServiceService.mapToDTO(updatedTypeService));
    }

    // Eliminar un typeServiceo por ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTypeService(@PathVariable Long id) {
        typeServiceService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
