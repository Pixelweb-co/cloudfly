package com.app.starter1.services;

import com.app.starter1.dto.DaneCodeDTO;
import com.app.starter1.persistence.entity.DaneCode;
import com.app.starter1.persistence.repository.DaneCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing DANE geographic codes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DaneCodeService {

    private final DaneCodeRepository repository;

    /**
     * Get all DANE codes
     */
    @Transactional(readOnly = true)
    public List<DaneCodeDTO> getAll() {
        return repository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all departments
     */
    @Transactional(readOnly = true)
    public List<DaneCodeDTO> getDepartamentos() {
        return repository.findByTipoAndActivoOrderByNombreAsc(DaneCode.TipoDane.DEPARTAMENTO, true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get cities by department code
     */
    @Transactional(readOnly = true)
    public List<DaneCodeDTO> getCiudadesByDepartamento(String codigoDepartamento) {
        return repository.findByTipoAndCodigoDepartamentoAndActivoOrderByNombreAsc(
                DaneCode.TipoDane.CIUDAD,
                codigoDepartamento,
                true).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get DANE code by codigo
     */
    @Transactional(readOnly = true)
    public DaneCodeDTO getByCodigo(String codigo) {
        return repository.findByCodigo(codigo)
                .map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("DANE code not found: " + codigo));
    }

    /**
     * Create new DANE code
     */
    @Transactional
    public DaneCodeDTO create(DaneCodeDTO dto) {
        if (repository.existsByCodigo(dto.getCodigo())) {
            throw new RuntimeException("DANE code already exists: " + dto.getCodigo());
        }

        DaneCode entity = toEntity(dto);
        DaneCode saved = repository.save(entity);
        log.info("Created DANE code: {}", saved.getCodigo());
        return toDTO(saved);
    }

    /**
     * Update DANE code
     */
    @Transactional
    public DaneCodeDTO update(Long id, DaneCodeDTO dto) {
        DaneCode existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("DANE code not found with ID: " + id));

        existing.setNombre(dto.getNombre());
        existing.setActivo(dto.getActivo());

        DaneCode saved = repository.save(existing);
        log.info("Updated DANE code: {}", saved.getCodigo());
        return toDTO(saved);
    }

    /**
     * Delete (soft delete by marking as inactive)
     */
    @Transactional
    public void delete(Long id) {
        DaneCode existing = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("DANE code not found with ID: " + id));

        existing.setActivo(false);
        repository.save(existing);
        log.info("Deactivated DANE code: {}", existing.getCodigo());
    }

    // ========== MAPPERS ==========

    private DaneCodeDTO toDTO(DaneCode entity) {
        return DaneCodeDTO.builder()
                .id(entity.getId())
                .tipo(entity.getTipo().name())
                .codigo(entity.getCodigo())
                .nombre(entity.getNombre())
                .codigoDepartamento(entity.getCodigoDepartamento())
                .activo(entity.getActivo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private DaneCode toEntity(DaneCodeDTO dto) {
        return DaneCode.builder()
                .tipo(DaneCode.TipoDane.valueOf(dto.getTipo()))
                .codigo(dto.getCodigo())
                .nombre(dto.getNombre())
                .codigoDepartamento(dto.getCodigoDepartamento())
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();
    }
}
