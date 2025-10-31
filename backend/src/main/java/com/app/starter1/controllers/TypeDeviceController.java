package com.app.starter1.controllers;

import com.app.starter1.dto.DeleteResponse;
import com.app.starter1.dto.TypeDeviceDTO;
import com.app.starter1.persistence.entity.TypeDevice;
import com.app.starter1.persistence.services.TypeDeviceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/type-device")
public class TypeDeviceController {

    @Autowired
    private TypeDeviceService typeDeviceService;

    // Obtener todos los typeDeviceos
    @GetMapping
    public ResponseEntity<List<TypeDeviceDTO>> getAllTypeDevices() {
        List<TypeDeviceDTO> typeDevices = typeDeviceService.findAll();
        return ResponseEntity.ok(typeDevices);
    }

    // Obtener typeDeviceo por ID
    @GetMapping("/{id}")
    public ResponseEntity<TypeDeviceDTO> getTypeDeviceById(@PathVariable Long id) {
        TypeDeviceDTO typeDevice = typeDeviceService.findById(id);
        return ResponseEntity.ok(typeDevice);
    }

    // Crear un nuevo typeDeviceo
    @PostMapping
    public ResponseEntity<TypeDeviceDTO> createTypeDevice(@RequestBody TypeDeviceDTO typeDeviceDTO) {
        TypeDevice typeDevice = typeDeviceService.mapToEntity(typeDeviceDTO);
        TypeDevice savedTypeDevice = typeDeviceService.save(typeDevice);
        return ResponseEntity.ok(typeDeviceService.mapToDTO(savedTypeDevice));
    }

    // Actualizar un typeDeviceo existente
    @PutMapping("/{id}")
    public ResponseEntity<TypeDeviceDTO> updateTypeDevice(@PathVariable Long id, @RequestBody TypeDeviceDTO typeDeviceDTO) {
        TypeDevice existingTypeDevice = typeDeviceService.findEntityById(id);
        typeDeviceService.updateEntityFromDTO(existingTypeDevice, typeDeviceDTO);


        TypeDevice updatedTypeDevice = typeDeviceService.save(existingTypeDevice);
        return ResponseEntity.ok(typeDeviceService.mapToDTO(updatedTypeDevice));
    }

    // Eliminar un typeDeviceo por ID
    @DeleteMapping("/{id}")
    public ResponseEntity<DeleteResponse> deleteTypeDevice(@PathVariable Long id) {
        typeDeviceService.deleteById(id);

        DeleteResponse deleteResponse = new DeleteResponse("sucess",id);

        return ResponseEntity.ok(deleteResponse);
    }
}
