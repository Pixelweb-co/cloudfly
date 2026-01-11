package com.app.starter1.services;

import com.app.starter1.dto.ProveedorRequest;
import com.app.starter1.dto.ProveedorResponse;
import com.app.starter1.mapper.ProveedorMapper;
import com.app.starter1.persistence.entity.Proveedor;
import com.app.starter1.persistence.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProveedorService {

    private final ProveedorRepository repository;
    private final ProveedorMapper mapper;

    @Transactional
    public ProveedorResponse crear(ProveedorRequest request, Long tenantId, String username) {
        log.info("Creando proveedor para tenant: {}", tenantId);

        // Validar que no exista
        if (repository.existsByTenantIdAndNumeroDocumento(tenantId, request.getNumeroDocumento())) {
            throw new RuntimeException("Ya existe un proveedor con ese número de documento");
        }

        Proveedor proveedor = mapper.toEntity(request, tenantId);
        proveedor.setCreatedBy(username);

        proveedor = repository.save(proveedor);

        log.info("Proveedor creado: {} - {}", proveedor.getId(), proveedor.getRazonSocial());
        return mapper.toResponse(proveedor);
    }

    @Transactional
    public ProveedorResponse actualizar(Long id, ProveedorRequest request) {
        log.info("Actualizando proveedor ID: {}", id);

        Proveedor proveedor = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        mapper.updateEntity(proveedor, request);
        proveedor = repository.save(proveedor);

        log.info("Proveedor actualizado: {}", id);
        return mapper.toResponse(proveedor);
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> listar(Long tenantId, Boolean soloActivos) {
        List<Proveedor> proveedores;

        if (soloActivos != null && soloActivos) {
            proveedores = repository.findByTenantIdAndActivoTrue(tenantId);
        } else {
            proveedores = repository.findByTenantId(tenantId);
        }

        return proveedores.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProveedorResponse buscarPorId(Long id) {
        Proveedor proveedor = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        return mapper.toResponse(proveedor);
    }

    @Transactional(readOnly = true)
    public ProveedorResponse buscarPorNit(Long tenantId, String numeroDocumento) {
        Proveedor proveedor = repository.findByTenantIdAndNumeroDocumento(tenantId, numeroDocumento)
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));
        return mapper.toResponse(proveedor);
    }

    @Transactional(readOnly = true)
    public List<ProveedorResponse> buscarPorNombre(Long tenantId, String razonSocial) {
        return repository.findByTenantIdAndRazonSocialContainingIgnoreCase(tenantId, razonSocial).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void eliminar(Long id) {
        log.info("Eliminando proveedor ID: {}", id);

        if (!repository.existsById(id)) {
            throw new RuntimeException("Proveedor no encontrado");
        }

        repository.deleteById(id);
        log.info("Proveedor eliminado: {}", id);
    }
}
