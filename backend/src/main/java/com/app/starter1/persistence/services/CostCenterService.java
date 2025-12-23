package com.app.starter1.persistence.services;

import com.app.starter1.persistence.entity.CostCenter;
import com.app.starter1.persistence.repository.CostCenterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio para gestión de Centros de Costo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CostCenterService {

    private final CostCenterRepository repository;

    /**
     * Obtener todos los centros de costo activos
     */
    @Transactional(readOnly = true)
    public List<CostCenter> getAllActive() {
        log.info("Fetching all active cost centers");
        return repository.findByIsActiveTrueOrderByCodeAsc();
    }

    /**
     * Obtener centro de costo por ID
     */
    @Transactional(readOnly = true)
    public CostCenter getById(Long id) {
        log.info("Fetching cost center by id: {}", id);
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Centro de costo no encontrado: " + id));
    }

    /**
     * Obtener centros de costo raíz (sin padre)
     */
    @Transactional(readOnly = true)
    public List<CostCenter> getRootCenters() {
        log.info("Fetching root cost centers");
        return repository.findByParentIdIsNullAndIsActiveTrueOrderByCodeAsc();
    }

    /**
     * Obtener centros de costo hijos
     */
    @Transactional(readOnly = true)
    public List<CostCenter> getChildCenters(Long parentId) {
        log.info("Fetching child cost centers for parent: {}", parentId);
        return repository.findByParentIdAndIsActiveTrueOrderByCodeAsc(parentId);
    }

    /**
     * Crear nuevo centro de costo
     */
    @Transactional
    public CostCenter create(CostCenter costCenter) {
        log.info("Creating cost center: {}", costCenter.getCode());

        // Validar código único
        if (repository.existsByCode(costCenter.getCode())) {
            throw new IllegalArgumentException("Ya existe un centro de costo con el código: " + costCenter.getCode());
        }

        return repository.save(costCenter);
    }

    /**
     * Actualizar centro de costo
     */
    @Transactional
    public CostCenter update(Long id, CostCenter costCenter) {
        log.info("Updating cost center: {}", id);

        CostCenter existing = getById(id);

        // Validar código único si cambió
        if (!existing.getCode().equals(costCenter.getCode()) &&
                repository.existsByCode(costCenter.getCode())) {
            throw new IllegalArgumentException("Ya existe un centro de costo con el código: " + costCenter.getCode());
        }

        existing.setCode(costCenter.getCode());
        existing.setName(costCenter.getName());
        existing.setDescription(costCenter.getDescription());
        existing.setParent(costCenter.getParent());
        existing.setIsActive(costCenter.getIsActive());

        return repository.save(existing);
    }

    /**
     * Eliminar (desactivar) centro de costo
     */
    @Transactional
    public void delete(Long id) {
        log.info("Deleting cost center: {}", id);
        CostCenter costCenter = getById(id);
        costCenter.setIsActive(false);
        repository.save(costCenter);
    }
}
