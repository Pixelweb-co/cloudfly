package com.app.starter1.persistence.services;

import com.app.starter1.dto.TypeServiceDTO;
import com.app.starter1.persistence.entity.TipoServicio;
import com.app.starter1.persistence.repository.TypeServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TypeServiceService {

    @Autowired
    private TypeServiceRepository typeServiceRepository;



    // Crear o actualizar un tipoServicioo
    public TipoServicio save(TipoServicio tipoServicio) {
        return typeServiceRepository.save(tipoServicio);
    }

    // Obtener todos los tipoServicioos como DTOs
    public List<TypeServiceDTO> findAll() {
        return typeServiceRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Buscar tipoServicioo por ID
    public TypeServiceDTO findById(Long id) {
        TipoServicio tipoServicio = typeServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TipoServicio not found"));
        return mapToDTO(tipoServicio);
    }

    // Buscar entidad TipoServicioo por ID
    public TipoServicio findEntityById(Long id) {
        return typeServiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TipoServicio not found"));
    }

    // Eliminar tipoServicioo por ID
    public void deleteById(Long id) {
        if (!typeServiceRepository.existsById(id)) {
            throw new RuntimeException("TipoServicio not found");
        }
        typeServiceRepository.deleteById(id);
    }


    // Método para mapear entidad a DTO
    public TypeServiceDTO mapToDTO(TipoServicio tipoServicio) {
        return new TypeServiceDTO(
                tipoServicio.getId(),
                tipoServicio.getDescripcion(),
                tipoServicio.getColor()

        );
    }

    // Método para convertir DTO a entidad
    public TipoServicio mapToEntity(TypeServiceDTO tipoServicioDTO) {


        return TipoServicio.builder()
                .id(tipoServicioDTO.getId())
                .descripcion(tipoServicioDTO.getTypeService())
                .color(tipoServicioDTO.getColor())
                .build();
    }

    // Método para actualizar entidad desde DTO
    public void updateEntityFromDTO(TipoServicio existingTipoServicio, TypeServiceDTO tipoServicioDTO) {
        existingTipoServicio.setDescripcion(tipoServicioDTO.getTypeService());
        existingTipoServicio.setColor(tipoServicioDTO.getColor());

    }
}
