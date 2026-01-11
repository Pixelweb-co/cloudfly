package com.app.starter1.mapper;

import com.app.starter1.dto.ProveedorRequest;
import com.app.starter1.dto.ProveedorResponse;
import com.app.starter1.persistence.entity.Proveedor;
import org.springframework.stereotype.Component;

@Component
public class ProveedorMapper {

    public Proveedor toEntity(ProveedorRequest request, Long tenantId) {
        if (request == null) {
            return null;
        }

        return Proveedor.builder()
                .tenantId(tenantId)
                .tipoDocumento(request.getTipoDocumento())
                .numeroDocumento(request.getNumeroDocumento())
                .dv(request.getDv())
                .razonSocial(request.getRazonSocial())
                .nombreComercial(request.getNombreComercial())
                .direccion(request.getDireccion())
                .telefono(request.getTelefono())
                .email(request.getEmail())
                .codigoDaneCiudad(request.getCodigoDaneCiudad())
                .ciudad(request.getCiudad())
                .codigoDaneDepartamento(request.getCodigoDaneDepartamento())
                .departamento(request.getDepartamento())
                .pais(request.getPais() != null ? request.getPais() : "CO")
                .responsabilidadesFiscales(request.getResponsabilidadesFiscales())
                .regimenFiscal(request.getRegimenFiscal())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .esFacturadorElectronico(
                        request.getEsFacturadorElectronico() != null ? request.getEsFacturadorElectronico() : false)
                .notas(request.getNotas())
                .build();
    }

    public void updateEntity(Proveedor entity, ProveedorRequest request) {
        if (entity == null || request == null) {
            return;
        }

        entity.setTipoDocumento(request.getTipoDocumento());
        entity.setNumeroDocumento(request.getNumeroDocumento());
        entity.setDv(request.getDv());
        entity.setRazonSocial(request.getRazonSocial());
        entity.setNombreComercial(request.getNombreComercial());
        entity.setDireccion(request.getDireccion());
        entity.setTelefono(request.getTelefono());
        entity.setEmail(request.getEmail());
        entity.setCodigoDaneCiudad(request.getCodigoDaneCiudad());
        entity.setCiudad(request.getCiudad());
        entity.setCodigoDaneDepartamento(request.getCodigoDaneDepartamento());
        entity.setDepartamento(request.getDepartamento());
        entity.setPais(request.getPais() != null ? request.getPais() : "CO");
        entity.setResponsabilidadesFiscales(request.getResponsabilidadesFiscales());
        entity.setRegimenFiscal(request.getRegimenFiscal());

        if (request.getActivo() != null) {
            entity.setActivo(request.getActivo());
        }
        if (request.getEsFacturadorElectronico() != null) {
            entity.setEsFacturadorElectronico(request.getEsFacturadorElectronico());
        }

        entity.setNotas(request.getNotas());
    }

    public ProveedorResponse toResponse(Proveedor entity) {
        if (entity == null) {
            return null;
        }

        return ProveedorResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .tipoDocumento(entity.getTipoDocumento())
                .numeroDocumento(entity.getNumeroDocumento())
                .dv(entity.getDv())
                .nitCompleto(entity.getNitCompleto())
                .razonSocial(entity.getRazonSocial())
                .nombreComercial(entity.getNombreComercial())
                .direccion(entity.getDireccion())
                .telefono(entity.getTelefono())
                .email(entity.getEmail())
                .codigoDaneCiudad(entity.getCodigoDaneCiudad())
                .ciudad(entity.getCiudad())
                .codigoDaneDepartamento(entity.getCodigoDaneDepartamento())
                .departamento(entity.getDepartamento())
                .pais(entity.getPais())
                .responsabilidadesFiscales(entity.getResponsabilidadesFiscales())
                .regimenFiscal(entity.getRegimenFiscal())
                .activo(entity.getActivo())
                .esFacturadorElectronico(entity.getEsFacturadorElectronico())
                .notas(entity.getNotas())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .build();
    }
}
