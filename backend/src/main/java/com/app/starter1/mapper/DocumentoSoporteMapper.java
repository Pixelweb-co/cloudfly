package com.app.starter1.mapper;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DocumentoSoporteMapper {

    private final ProveedorRepository proveedorRepository;

    public DocumentoSoporte toEntity(DocumentoSoporteRequest request, Long tenantId) {
        DocumentoSoporte doc = DocumentoSoporte.builder()
                .tenantId(tenantId)
                .fecha(request.getFecha())
                .horaEmision(java.time.LocalTime.now())
                .observaciones(request.getObservaciones())
                .estado("BORRADOR")
                .build();

        // Si se envió proveedorId, cargar y asociar datos
        if (request.getProveedorId() != null) {
            proveedorRepository.findById(request.getProveedorId())
                    .ifPresent(p -> {
                        doc.setProveedorId(p.getId());
                        doc.setProveedorRazonSocial(p.getRazonSocial());
                        doc.setProveedorNumeroDocumento(p.getNumeroDocumento());
                        // doc.setProveedorDV(p.getDv());
                        doc.setProveedorTipoDocumento(p.getTipoDocumento());
                        doc.setProveedorDireccion(p.getDireccion());
                        doc.setProveedorCiudad(p.getCiudad());
                        doc.setProveedorDepartamento(p.getDepartamento());
                        doc.setProveedorEmail(p.getEmail());
                        // doc.setProveedorTelefono(p.getTelefono());
                    });
        }

        // Convertir items
        if (request.getItems() != null) {
            request.getItems().forEach(itemRequest -> {
                DocumentoSoporteItem item = toItemEntity(itemRequest);
                item.setDocumentoSoporte(doc);
                doc.getItems().add(item);
            });
        }

        // Calcular totales
        doc.calculateTotals();

        return doc;
    }

    public DocumentoSoporteItem toItemEntity(DocumentoSoporteRequest.ItemRequest dto) {
        DocumentoSoporteItem item = DocumentoSoporteItem.builder()
                .productName(dto.getProductName())
                .descripcion(dto.getDescripcion())
                .quantity(dto.getQuantity())
                .unitPrice(dto.getUnitPrice())
                .unidadMedida(dto.getUnidadMedida())
                .porcentajeImpuesto(dto.getPorcentajeImpuesto())
                .build();

        item.calculateTotals();
        return item;
    }

    // Helper alias for DTO -> Entity (if used elsewhere)
    public DocumentoSoporteItem toItemEntity(DocumentoSoporteItemDTO dto) {
        DocumentoSoporteItem item = DocumentoSoporteItem.builder()
                .numeroLinea(dto.getNumeroLinea())
                .productId(dto.getProductId())
                .productName(dto.getProductName())
                .descripcion(dto.getDescripcion())
                .quantity(dto.getQuantity())
                .unitPrice(dto.getUnitPrice())
                .subtotal(dto.getSubtotal())
                .unidadMedida(dto.getUnidadMedidaUNECE())
                .porcentajeImpuesto(dto.getPorcentajeImpuesto())
                .total(dto.getTotal())
                .build();

        if (item.getSubtotal() == null || item.getTotal() == null) {
            item.calculateTotals();
        }
        return item;
    }

    public DocumentoSoporteResponse toResponse(DocumentoSoporte entity) {
        if (entity == null) {
            return null;
        }

        return DocumentoSoporteResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .numeroDocumento(entity.getNumeroDocumento())
                .prefijoDian(entity.getPrefijoDian())
                .consecutivoDian(entity.getConsecutivoDian())
                .cuds(entity.getCuds())
                .fecha(entity.getFecha())
                .horaEmision(entity.getHoraEmision())
                // Proveedor
                .proveedorId(entity.getProveedorId())
                .proveedorTipoDocumento(entity.getProveedorTipoDocumento())
                .proveedorNumeroDocumento(entity.getProveedorNumeroDocumento())
                // .proveedorDV(entity.getProveedorDV()) // Ensure field exists/is accessible
                .proveedorRazonSocial(entity.getProveedorRazonSocial())
                .proveedorDireccion(entity.getProveedorDireccion())
                .proveedorCiudad(entity.getProveedorCiudad())
                .proveedorDepartamento(entity.getProveedorDepartamento())
                // .proveedorPais(entity.getProveedorPais())
                // .proveedorTelefono(entity.getProveedorTelefono())
                .proveedorEmail(entity.getProveedorEmail())
                // .cufeProveedor(entity.getCufeProveedor()) // Check if exists
                // .numeroFacturaProveedor(entity.getNumeroFacturaProveedor()) // Check if
                // exists
                // Items
                .items(entity.getItems().stream()
                        .map(this::toItemDTO)
                        .collect(Collectors.toList()))
                // Totales
                .subtotal(entity.getSubtotal())
                .totalDescuentos(entity.getTotalDescuentos())
                // .totalCargos(entity.getTotalCargos())
                // .baseGravable(entity.getBaseGravable())
                // .totalIva(entity.getTotalIva())
                .totalImpuestos(entity.getTotalImpuestos())
                .total(entity.getTotal())
                // Estado
                .estado(entity.getEstado())
                .ambienteDian(entity.getAmbienteDian())
                .mensajeDian(entity.getMensajeDian())
                .observaciones(entity.getObservaciones())
                // Contabilidad
                .contabilidadGenerada(entity.getAccountingGenerated())
                .asientoContableId(entity.getAccountingVoucherId())
                // Auditoría
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                // .approvedBy(entity.getApprovedBy())
                // .approvedAt(entity.getApprovedAt())
                .build();
    }

    public DocumentoSoporteItemDTO toItemDTO(DocumentoSoporteItem entity) {
        return DocumentoSoporteItemDTO.builder()
                .id(entity.getId())
                .numeroLinea(entity.getNumeroLinea())
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                // .codigoProducto(entity.getCodigoProducto())
                .descripcion(entity.getDescripcion())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .subtotal(entity.getSubtotal())
                .unidadMedidaUNECE(entity.getUnidadMedida())
                // .marca(entity.getMarca())
                // .modelo(entity.getModelo())
                // .tipoImpuesto(entity.getTipoImpuesto())
                // .tarifaIVA(entity.getTarifaIVA())
                .porcentajeImpuesto(entity.getPorcentajeImpuesto())
                .impuestoCalculado(entity.getImpuestoCalculado())
                // .valorDescuentos(entity.getValorDescuentos())
                // .baseImpuesto(entity.getBaseImpuesto())
                .total(entity.getTotal())
                .build();
    }
}
