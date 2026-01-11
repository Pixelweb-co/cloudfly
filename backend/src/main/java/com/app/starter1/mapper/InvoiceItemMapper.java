package com.app.starter1.mapper;

import com.app.starter1.dto.InvoiceItemDTO;
import com.app.starter1.persistence.entity.InvoiceItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Mapper para convertir entre InvoiceItem entity y DTO
 */
@Component
public class InvoiceItemMapper {

    /**
     * Convierte DTO a Entity
     */
    public InvoiceItem toEntity(InvoiceItemDTO dto) {
        if (dto == null) {
            return null;
        }

        InvoiceItem entity = InvoiceItem.builder()
                .id(dto.getId())
                .productId(dto.getProductId())
                .productName(dto.getProductName())
                .quantity(dto.getQuantity())
                .unitPrice(dto.getUnitPrice())
                .discount(dto.getDiscount())
                .subtotal(dto.getSubtotal())
                .tax(dto.getTax())
                .total(dto.getTotal())
                // Campos DIAN
                .codigoProducto(dto.getCodigoProducto())
                .descripcion(dto.getDescripcion())
                .unidadMedidaUNECE(dto.getUnidadMedidaUNECE())
                .unidadMedidaDescripcion(dto.getUnidadMedidaDescripcion())
                .marca(dto.getMarca())
                .modelo(dto.getModelo())
                .tipoImpuesto(dto.getTipoImpuesto())
                .tarifaIVA(dto.getTarifaIVA())
                .porcentajeImpuesto(dto.getPorcentajeImpuesto())
                .baseImpuesto(dto.getBaseImpuesto())
                .impuestoCalculado(dto.getImpuestoCalculado())
                .descuentosLinea(dto.getDescuentosLinea())
                .valorDescuentos(dto.getValorDescuentos() != null ? dto.getValorDescuentos() : BigDecimal.ZERO)
                .cargosLinea(dto.getCargosLinea())
                .valorCargos(dto.getValorCargos() != null ? dto.getValorCargos() : BigDecimal.ZERO)
                .numeroLinea(dto.getNumeroLinea())
                .esGratuito(dto.getEsGratuito() != null ? dto.getEsGratuito() : false)
                .notasLinea(dto.getNotasLinea())
                .build();

        // Si los valores calculados no vienen, calcularlos
        if (entity.getSubtotal() == null || entity.getBaseImpuesto() == null) {
            entity.calcularTodo();
        }

        return entity;
    }

    /**
     * Actualiza una entidad existente con datos del DTO
     */
    public void updateEntity(InvoiceItem entity, InvoiceItemDTO dto) {
        if (entity == null || dto == null) {
            return;
        }

        entity.setProductId(dto.getProductId());
        entity.setProductName(dto.getProductName());
        entity.setQuantity(dto.getQuantity());
        entity.setUnitPrice(dto.getUnitPrice());
        entity.setDiscount(dto.getDiscount());
        entity.setSubtotal(dto.getSubtotal());
        entity.setTax(dto.getTax());
        entity.setTotal(dto.getTotal());

        // Campos DIAN
        entity.setCodigoProducto(dto.getCodigoProducto());
        entity.setDescripcion(dto.getDescripcion());
        entity.setUnidadMedidaUNECE(dto.getUnidadMedidaUNECE());
        entity.setUnidadMedidaDescripcion(dto.getUnidadMedidaDescripcion());
        entity.setMarca(dto.getMarca());
        entity.setModelo(dto.getModelo());
        entity.setTipoImpuesto(dto.getTipoImpuesto());
        entity.setTarifaIVA(dto.getTarifaIVA());
        entity.setPorcentajeImpuesto(dto.getPorcentajeImpuesto());
        entity.setBaseImpuesto(dto.getBaseImpuesto());
        entity.setImpuestoCalculado(dto.getImpuestoCalculado());
        entity.setDescuentosLinea(dto.getDescuentosLinea());
        entity.setValorDescuentos(dto.getValorDescuentos() != null ? dto.getValorDescuentos() : BigDecimal.ZERO);
        entity.setCargosLinea(dto.getCargosLinea());
        entity.setValorCargos(dto.getValorCargos() != null ? dto.getValorCargos() : BigDecimal.ZERO);
        entity.setNumeroLinea(dto.getNumeroLinea());
        entity.setEsGratuito(dto.getEsGratuito() != null ? dto.getEsGratuito() : false);
        entity.setNotasLinea(dto.getNotasLinea());

        // Recalcular si es necesario
        if (entity.getSubtotal() == null || entity.getBaseImpuesto() == null) {
            entity.calcularTodo();
        }
    }

    /**
     * Convierte Entity a DTO
     */
    public InvoiceItemDTO toDTO(InvoiceItem entity) {
        if (entity == null) {
            return null;
        }

        return InvoiceItemDTO.builder()
                .id(entity.getId())
                .invoiceId(entity.getInvoice() != null ? entity.getInvoice().getId() : null)
                .productId(entity.getProductId())
                .productName(entity.getProductName())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .discount(entity.getDiscount())
                .subtotal(entity.getSubtotal())
                .tax(entity.getTax())
                .total(entity.getTotal())
                // Campos DIAN
                .codigoProducto(entity.getCodigoProducto())
                .descripcion(entity.getDescripcion())
                .unidadMedidaUNECE(entity.getUnidadMedidaUNECE())
                .unidadMedidaDescripcion(entity.getUnidadMedidaDescripcion())
                .marca(entity.getMarca())
                .modelo(entity.getModelo())
                .tipoImpuesto(entity.getTipoImpuesto())
                .tarifaIVA(entity.getTarifaIVA())
                .porcentajeImpuesto(entity.getPorcentajeImpuesto())
                .baseImpuesto(entity.getBaseImpuesto())
                .impuestoCalculado(entity.getImpuestoCalculado())
                .descuentosLinea(entity.getDescuentosLinea())
                .valorDescuentos(entity.getValorDescuentos())
                .cargosLinea(entity.getCargosLinea())
                .valorCargos(entity.getValorCargos())
                .numeroLinea(entity.getNumeroLinea())
                .esGratuito(entity.getEsGratuito())
                .notasLinea(entity.getNotasLinea())
                .build();
    }
}
