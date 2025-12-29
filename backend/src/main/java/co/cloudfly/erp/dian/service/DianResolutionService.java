package co.cloudfly.erp.dian.service;

import co.cloudfly.erp.dian.api.dto.DianResolutionRequest;
import co.cloudfly.erp.dian.api.dto.DianResolutionResponse;
import co.cloudfly.erp.dian.domain.entity.DianResolution;
import co.cloudfly.erp.dian.domain.repository.DianResolutionRepository;
import co.cloudfly.erp.dian.exception.DianBusinessException;
import co.cloudfly.erp.dian.exception.DianNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de resoluciones DIAN
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DianResolutionService {

    private final DianResolutionRepository repository;

    /**
     * Lista todas las resoluciones de un tenant
     */
    @Transactional(readOnly = true)
    public List<DianResolutionResponse> findAllByTenant(Long tenantId) {
        log.info("Buscando resoluciones para tenant: {}", tenantId);
        return repository.findByTenantId(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista resoluciones por tenant y compañía
     */
    @Transactional(readOnly = true)
    public List<DianResolutionResponse> findByTenantAndCompany(Long tenantId, Long companyId) {
        log.info("Buscando resoluciones para tenant: {} y compañía: {}", tenantId, companyId);
        return repository.findByTenantIdAndCompanyId(tenantId, companyId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una resolución por ID
     */
    @Transactional(readOnly = true)
    public DianResolutionResponse findById(Long id, Long tenantId) {
        DianResolution resolution = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Resolución", id));

        if (!resolution.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("La resolución no pertenece a este tenant");
        }

        return toResponse(resolution);
    }

    /**
     * Crea una nueva resolución
     */
    @Transactional
    public DianResolutionResponse create(Long tenantId, DianResolutionRequest request) {
        log.info("Creando resolución para tenant: {}", tenantId);

        // Validar que no exista otra resolución activa con el mismo prefijo y tipo de
        // documento
        if (request.active() && repository.existsActiveResolution(
                tenantId,
                request.companyId(),
                request.documentType(),
                request.prefix(),
                null)) {
            throw new DianBusinessException(
                    "DUPLICATE_ACTIVE_RESOLUTION",
                    "Ya existe una resolución activa para este tipo de documento y prefijo");
        }

        // Validar que no haya superposición de rangos
        if (repository.hasRangeOverlap(
                tenantId,
                request.companyId(),
                request.documentType(),
                request.prefix(),
                request.numberRangeFrom(),
                request.numberRangeTo(),
                null)) {
            throw new DianBusinessException(
                    "RANGE_OVERLAP",
                    "El rango numérico se superpone con otra resolución existente");
        }

        // El número actual inicia en el inicio del rango
        DianResolution resolution = DianResolution.builder()
                .tenantId(tenantId)
                .companyId(request.companyId())
                .documentType(request.documentType())
                .prefix(request.prefix())
                .numberRangeFrom(request.numberRangeFrom())
                .numberRangeTo(request.numberRangeTo())
                .currentNumber(request.numberRangeFrom())
                .technicalKey(request.technicalKey())
                .resolutionNumber(request.resolutionNumber())
                .validFrom(request.validFrom())
                .validTo(request.validTo())
                .active(request.active())
                .build();

        DianResolution saved = repository.save(resolution);
        log.info("Resolución creada con ID: {}", saved.getId());

        return toResponse(saved);
    }

    /**
     * Actualiza una resolución existente
     */
    @Transactional
    public DianResolutionResponse update(Long id, Long tenantId, DianResolutionRequest request) {
        log.info("Actualizando resolución ID: {}", id);

        DianResolution resolution = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Resolución", id));

        if (!resolution.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("La resolución no pertenece a este tenant");
        }

        // Validar que no exista otra resolución activa (si se está activando)
        if (request.active() && !resolution.getActive()
                && repository.existsActiveResolution(
                        tenantId,
                        request.companyId(),
                        request.documentType(),
                        request.prefix(),
                        id)) {
            throw new DianBusinessException(
                    "DUPLICATE_ACTIVE_RESOLUTION",
                    "Ya existe otra resolución activa para este tipo de documento y prefijo");
        }

        // Validar superposición de rangos (excluyendo el ID actual)
        if (repository.hasRangeOverlap(
                tenantId,
                request.companyId(),
                request.documentType(),
                request.prefix(),
                request.numberRangeFrom(),
                request.numberRangeTo(),
                id)) {
            throw new DianBusinessException(
                    "RANGE_OVERLAP",
                    "El rango numérico se superpone con otra resolución");
        }

        // No permitir cambiar el rango si ya se ha usado algún número
        if (!resolution.getCurrentNumber().equals(resolution.getNumberRangeFrom())) {
            if (!request.numberRangeFrom().equals(resolution.getNumberRangeFrom())) {
                throw new DianBusinessException(
                        "CANNOT_CHANGE_RANGE",
                        "No se puede modificar el rango inicial porque ya se han generado números");
            }
        }

        // Actualizar campos
        resolution.setCompanyId(request.companyId());
        resolution.setDocumentType(request.documentType());
        resolution.setPrefix(request.prefix());
        resolution.setNumberRangeFrom(request.numberRangeFrom());
        resolution.setNumberRangeTo(request.numberRangeTo());
        resolution.setTechnicalKey(request.technicalKey());
        resolution.setResolutionNumber(request.resolutionNumber());
        resolution.setValidFrom(request.validFrom());
        resolution.setValidTo(request.validTo());
        resolution.setActive(request.active());

        // Asegurar que currentNumber esté dentro del rango
        if (resolution.getCurrentNumber() < request.numberRangeFrom()) {
            resolution.setCurrentNumber(request.numberRangeFrom());
        }

        DianResolution updated = repository.save(resolution);
        log.info("Resolución actualizada: {}", id);

        return toResponse(updated);
    }

    /**
     * Elimina una resolución
     */
    @Transactional
    public void delete(Long id, Long tenantId) {
        log.info("Eliminando resolución ID: {}", id);

        DianResolution resolution = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Resolución", id));

        if (!resolution.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("La resolución no pertenece a este tenant");
        }

        // No permitir eliminar si ya se han usado números
        if (!resolution.getCurrentNumber().equals(resolution.getNumberRangeFrom())) {
            throw new DianBusinessException(
                    "CANNOT_DELETE_USED_RESOLUTION",
                    "No se puede eliminar una resolución que ya ha generado números. Desactívela en su lugar.");
        }

        repository.delete(resolution);
        log.info("Resolución eliminada: {}", id);
    }

    /**
     * Convierte entidad a DTO
     */
    private DianResolutionResponse toResponse(DianResolution resolution) {
        return new DianResolutionResponse(
                resolution.getId(),
                resolution.getTenantId(),
                resolution.getCompanyId(),
                resolution.getDocumentType(),
                resolution.getPrefix(),
                resolution.getNumberRangeFrom(),
                resolution.getNumberRangeTo(),
                resolution.getCurrentNumber(),
                resolution.getTechnicalKey(),
                resolution.getResolutionNumber(),
                resolution.getValidFrom(),
                resolution.getValidTo(),
                resolution.getActive(),
                resolution.isValid(),
                resolution.getRemainingNumbers(),
                resolution.getCreatedAt(),
                resolution.getUpdatedAt());
    }
}
