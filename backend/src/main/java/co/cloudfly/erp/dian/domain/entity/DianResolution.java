package co.cloudfly.erp.dian.domain.entity;

import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad que representa resoluciones de facturación DIAN
 */
@Entity
@Table(name = "dian_resolutions", indexes = {
        @Index(name = "idx_res_tenant_company", columnList = "tenant_id, company_id"),
        @Index(name = "idx_res_doc_type", columnList = "document_type"),
        @Index(name = "idx_res_prefix", columnList = "prefix"),
        @Index(name = "idx_res_active", columnList = "active"),
        @Index(name = "idx_res_validity", columnList = "valid_from, valid_to")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DianResolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID del tenant
     */
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    /**
     * ID de la compañía
     */
    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /**
     * Tipo de documento
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DianDocumentType documentType;

    /**
     * Prefijo de la numeración (ej: "FE", "NC", "ND")
     */
    @Column(name = "prefix", nullable = false, length = 10)
    private String prefix;

    /**
     * Número inicial del rango autorizado
     */
    @Column(name = "number_range_from", nullable = false)
    private Long numberRangeFrom;

    /**
     * Número final del rango autorizado
     */
    @Column(name = "number_range_to", nullable = false)
    private Long numberRangeTo;

    /**
     * Número actual (siguiente a utilizar)
     * Manejado por el backend al generar facturas
     */
    @Column(name = "current_number", nullable = false)
    private Long currentNumber;

    /**
     * Clave técnica de la resolución DIAN
     */
    @Column(name = "technical_key", nullable = false, length = 200)
    private String technicalKey;

    /**
     * Número de resolución DIAN
     */
    @Column(name = "resolution_number", length = 50)
    private String resolutionNumber;

    /**
     * Fecha desde la cual es válida la resolución
     */
    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    /**
     * Fecha hasta la cual es válida la resolución
     */
    @Column(name = "valid_to", nullable = false)
    private LocalDate validTo;

    /**
     * Indica si esta resolución está activa
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Verifica si la resolución está vigente en la fecha actual
     */
    @Transient
    public boolean isValid() {
        LocalDate now = LocalDate.now();
        return validFrom != null && validTo != null
                && !now.isBefore(validFrom) && !now.isAfter(validTo);
    }

    /**
     * Verifica si quedan números disponibles
     */
    @Transient
    public boolean hasAvailableNumbers() {
        return currentNumber != null && numberRangeTo != null
                && currentNumber < numberRangeTo;
    }

    /**
     * Calcula cuántos números quedan disponibles
     */
    @Transient
    public Long getRemainingNumbers() {
        if (currentNumber == null || numberRangeTo == null) {
            return 0L;
        }
        return numberRangeTo - currentNumber + 1;
    }
}
