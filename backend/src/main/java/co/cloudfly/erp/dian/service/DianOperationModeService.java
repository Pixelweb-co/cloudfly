package co.cloudfly.erp.dian.service;

import co.cloudfly.erp.dian.api.dto.DianOperationModeRequest;
import co.cloudfly.erp.dian.api.dto.DianOperationModeResponse;
import co.cloudfly.erp.dian.domain.entity.DianOperationMode;
import co.cloudfly.erp.dian.domain.repository.DianOperationModeRepository;
import co.cloudfly.erp.dian.exception.DianBusinessException;
import co.cloudfly.erp.dian.exception.DianNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de modos de operación DIAN
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DianOperationModeService {

    private final DianOperationModeRepository repository;

    /**
     * Lista todos los modos de operación de un tenant
     */
    @Transactional(readOnly = true)
    public List<DianOperationModeResponse> findAllByTenant(Long tenantId) {
        log.info("Buscando modos de operación para tenant: {}", tenantId);
        return repository.findByTenantId(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista modos de operación por tenant y compañía
     */
    @Transactional(readOnly = true)
    public List<DianOperationModeResponse> findByTenantAndCompany(Long tenantId, Long companyId) {
        log.info("Buscando modos de operación para tenant: {} y compañía: {}", tenantId, companyId);
        return repository.findByTenantIdAndCompanyId(tenantId, companyId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un modo de operación por ID
     */
    @Transactional(readOnly = true)
    public DianOperationModeResponse findById(Long id, Long tenantId) {
        DianOperationMode mode = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Modo de operación", id));

        // Validar que pertenece al tenant
        if (!mode.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("El modo de operación no pertenece a este tenant");
        }

        return toResponse(mode);
    }

    /**
     * Crea un nuevo modo de operación
     */
    @Transactional
    public DianOperationModeResponse create(Long tenantId, DianOperationModeRequest request) {
        log.info("Creando modo de operación para tenant: {}", tenantId);

        // Validar que no exista otro modo activo con la misma combinación
        if (request.active() && repository.existsActiveMode(
                tenantId,
                request.companyId(),
                request.documentType(),
                request.environment(),
                null)) {
            throw new DianBusinessException(
                    "DUPLICATE_ACTIVE_MODE",
                    "Ya existe un modo activo para esta combinación de compañía, tipo de documento y ambiente");
        }

        DianOperationMode mode = DianOperationMode.builder()
                .tenantId(tenantId)
                .companyId(request.companyId())
                .documentType(request.documentType())
                .environment(request.environment())
                .softwareId(request.softwareId())
                .pin(request.pin())
                .testSetId(request.testSetId())
                .certificationProcess(request.certificationProcess())
                .active(request.active())
                .build();

        DianOperationMode saved = repository.save(mode);
        log.info("Modo de operación creado con ID: {}", saved.getId());

        return toResponse(saved);
    }

    /**
     * Actualiza un modo de operación existente
     */
    @Transactional
    public DianOperationModeResponse update(Long id, Long tenantId, DianOperationModeRequest request) {
        log.info("Actualizando modo de operación ID: {} para tenant: {}", id, tenantId);

        DianOperationMode mode = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Modo de operación", id));

        // Validar que pertenece al tenant
        if (!mode.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("El modo de operación no pertenece a este tenant");
        }

        // Si se está activando, validar que no haya otro activo
        if (request.active() && !mode.getActive() // Se está activando
                && repository.existsActiveMode(
                        tenantId,
                        request.companyId(),
                        request.documentType(),
                        request.environment(),
                        id)) {
            throw new DianBusinessException(
                    "DUPLICATE_ACTIVE_MODE",
                    "Ya existe otro modo activo para esta combinación");
        }

        // Advertencia si está en producción
        if (mode.getEnvironment().name().equals("PRODUCTION")) {
            log.warn("Actualizando modo en PRODUCCIÓN - ID: {}", id);
        }

        // Actualizar campos
        mode.setCompanyId(request.companyId());
        mode.setDocumentType(request.documentType());
        mode.setEnvironment(request.environment());
        mode.setSoftwareId(request.softwareId());
        mode.setPin(request.pin());
        mode.setTestSetId(request.testSetId());
        mode.setCertificationProcess(request.certificationProcess());
        mode.setActive(request.active());

        DianOperationMode updated = repository.save(mode);
        log.info("Modo de operación actualizado: {}", id);

        return toResponse(updated);
    }

    /**
     * Elimina un modo de operación
     */
    @Transactional
    public void delete(Long id, Long tenantId) {
        log.info("Eliminando modo de operación ID: {} para tenant: {}", id, tenantId);

        DianOperationMode mode = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Modo de operación", id));

        // Validar que pertenece al tenant
        if (!mode.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("El modo de operación no pertenece a este tenant");
        }

        // Advertencia si está en producción y activo
        if (mode.getEnvironment().name().equals("PRODUCTION") && mode.getActive()) {
            log.warn("Eliminando modo ACTIVO en PRODUCCIÓN - ID: {}", id);
        }

        repository.delete(mode);
        log.info("Modo de operación eliminado: {}", id);
    }

    /**
     * Convierte entidad a DTO de respuesta
     */
    private DianOperationModeResponse toResponse(DianOperationMode mode) {
        return new DianOperationModeResponse(
                mode.getId(),
                mode.getTenantId(),
                mode.getCompanyId(),
                mode.getDocumentType(),
                mode.getEnvironment(),
                mode.getSoftwareId(),
                mode.getPin(),
                mode.getTestSetId(),
                mode.getCertificationProcess(),
                mode.getActive(),
                mode.getCreatedAt(),
                mode.getUpdatedAt());
    }
}
