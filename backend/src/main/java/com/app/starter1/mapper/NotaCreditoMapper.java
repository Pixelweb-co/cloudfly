package com.app.starter1.mapper;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.*;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class NotaCreditoMapper {

    public NotaCredito toEntity(NotaCreditoRequest request, Long tenantId) {
        NotaCredito nota = NotaCredito.builder()
                .tenantId(tenantId)
                .invoiceIdReferencia(request.getInvoiceIdReferencia())
                .cufeFacturaOriginal(request.getCufeFacturaOriginal())
                .numeroFacturaOriginal(request.getNumeroFacturaOriginal())
                .fechaFacturaOriginal(request.getFechaFacturaOriginal())
                .motivo(request.getMotivo())
                .codigoMotivoDian(request.getCodigoMotivoDian())
                .fechaEmision(request.getFechaEmision())
                .horaEmision(java.time.LocalTime.now())
                .ambienteDian(request.getAmbienteDian())
                .estado(NotaCredito.EstadoNotaCredito.BORRADOR)
                .build();

        // Convertir items
        if (request.getItems() != null) {
            request.getItems().forEach(itemDTO -> {
                NotaCreditoItem item = toItemEntity(itemDTO);
                nota.addItem(item);
            });
        }

        // Calcular totales
        nota.calcularTotales();

        return nota;
    }

    public NotaCreditoItem toItemEntity(NotaCreditoItemDTO dto) {
        return NotaCreditoItem.builder()
                .numeroLinea(dto.getNumeroLinea())
                .productId(dto.getProductId())
                .productName(dto.getProductName())
                .codigoProducto(dto.getCodigoProducto())
                .descripcion(dto.getDescripcion())
                .quantity(dto.getQuantity())
                .unitPrice(dto.getUnitPrice())
                .subtotal(dto.getSubtotal())
                .unidadMedidaUNECE(dto.getUnidadMedidaUNECE())
                .tipoImpuesto(dto.getTipoImpuesto())
                .porcentajeImpuesto(dto.getPorcentajeImpuesto())
                .baseImpuesto(dto.getBaseImpuesto())
                .impuestoCalculado(dto.getImpuestoCalculado())
                .valorDescuentos(dto.getValorDescuentos())
                .total(dto.getTotal())
                .build();
    }

    public NotaCreditoResponse toResponse(NotaCredito entity) {
        return NotaCreditoResponse.builder()
                .id(entity.getId())
                .tenantId(entity.getTenantId())
                .numeroNotaCredito(entity.getNumeroNotaCredito())
                .prefijoDian(entity.getPrefijoDian())
                .consecutivoDian(entity.getConsecutivoDian())
                .cufe(entity.getCufe())
                .invoiceIdReferencia(entity.getInvoiceIdReferencia())
                .cufeFacturaOriginal(entity.getCufeFacturaOriginal())
                .numeroFacturaOriginal(entity.getNumeroFacturaOriginal())
                .fechaFacturaOriginal(entity.getFechaFacturaOriginal())
                .motivo(entity.getMotivo())
                .codigoMotivoDian(entity.getCodigoMotivoDian())
                .fechaEmision(entity.getFechaEmision())
                .horaEmision(entity.getHoraEmision())
                .items(entity.getItems().stream()
                        .map(this::toItemDTO)
                        .collect(Collectors.toList()))
                .subtotal(entity.getSubtotal())
                .totalDescuentos(entity.getTotalDescuentos())
                .totalImpuestos(entity.getTotalImpuestos())
                .total(entity.getTotal())
                .estado(entity.getEstado() != null ? entity.getEstado().name() : null)
                .ambienteDian(entity.getAmbienteDian())
                .mensajeDian(entity.getMensajeDian())
                .contabilidadRevertida(entity.getContabilidadRevertida())
                .asientoReversionId(entity.getAsientoReversionId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .build();
    }

    public NotaCreditoItemDTO toItemDTO(NotaCreditoItem entity) {
        return NotaCreditoItemDTO.builder()
                .id(entity.getId())
                .numeroLinea(entity.getNumeroLinea())
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                .codigoProducto(entity.getCodigoProducto())
                .descripcion(entity.getDescripcion())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .subtotal(entity.getSubtotal())
                .unidadMedidaUNECE(entity.getUnidadMedidaUNECE())
                .tipoImpuesto(entity.getTipoImpuesto())
                .porcentajeImpuesto(entity.getPorcentajeImpuesto())
                .baseImpuesto(entity.getBaseImpuesto())
                .impuestoCalculado(entity.getImpuestoCalculado())
                .valorDescuentos(entity.getValorDescuentos())
                .total(entity.getTotal())
                .build();
    }
}
