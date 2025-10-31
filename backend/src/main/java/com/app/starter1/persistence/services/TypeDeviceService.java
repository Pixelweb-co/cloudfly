package com.app.starter1.persistence.services;

import com.app.starter1.dto.TypeDeviceDTO;
import com.app.starter1.persistence.entity.TypeDevice;
import com.app.starter1.persistence.repository.TypeDeviceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TypeDeviceService {

    @Autowired
    private TypeDeviceRepository typeDeviceRepository;



    // Crear o actualizar un typeDeviceo
    public TypeDevice save(TypeDevice typeDevice) {
        return typeDeviceRepository.save(typeDevice);
    }

    // Obtener todos los typeDeviceos como DTOs
    public List<TypeDeviceDTO> findAll() {
        return typeDeviceRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Buscar typeDeviceo por ID
    public TypeDeviceDTO findById(Long id) {
        TypeDevice typeDevice = typeDeviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TypeDevice not found"));
        return mapToDTO(typeDevice);
    }

    // Buscar entidad TypeDeviceo por ID
    public TypeDevice findEntityById(Long id) {
        return typeDeviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TypeDevice not found"));
    }

    // Eliminar typeDeviceo por ID
    public void deleteById(Long id) {
        if (!typeDeviceRepository.existsById(id)) {
            throw new RuntimeException("TypeDevice not found");
        }
        typeDeviceRepository.deleteById(id);
    }


    // Método para mapear entidad a DTO
    public TypeDeviceDTO mapToDTO(TypeDevice typeDevice) {
        return new TypeDeviceDTO(
                typeDevice.getId(),
                typeDevice.getTypeDevice(),
                typeDevice.getPlantillaVerificacion()
        );
    }

    // Método para convertir DTO a entidad
    public TypeDevice mapToEntity(TypeDeviceDTO typeDeviceDTO) {


        return TypeDevice.builder()
                .id(typeDeviceDTO.getId())
                .typeDevice(typeDeviceDTO.getTypeDevice())
                .plantillaVerificacion(typeDeviceDTO.getPlantillaVerificacion())

                .build();
    }

    // Método para actualizar entidad desde DTO
    public void updateEntityFromDTO(TypeDevice existingTypeDevice, TypeDeviceDTO typeDeviceDTO) {

        if (typeDeviceDTO.getTypeDevice() != null && !typeDeviceDTO.getTypeDevice().trim().isEmpty()) {
            existingTypeDevice.setTypeDevice(typeDeviceDTO.getTypeDevice());
        }

        if (typeDeviceDTO.getPlantillaVerificacion() != null && !typeDeviceDTO.getPlantillaVerificacion().trim().isEmpty()) {
            existingTypeDevice.setPlantillaVerificacion(typeDeviceDTO.getPlantillaVerificacion());
        }

    }
}
