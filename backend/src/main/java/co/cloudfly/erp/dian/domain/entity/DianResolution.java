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

    public Long getNumberRangeFrom() {
        return numberRangeFrom;
    }

    public void setNumberRangeFrom(Long numberRangeFrom) {
        this.numberRangeFrom = numberRangeFrom;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public DianDocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DianDocumentType documentType) {
        this.documentType = documentType;
    }

    public String getPrefix() {
        return prefix;
    }

    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }

    public Long getNumberRangeTo() {
        return numberRangeTo;
    }

    public void setNumberRangeTo(Long numberRangeTo) {
        this.numberRangeTo = numberRangeTo;
    }

    public Long getCurrentNumber() {
        return currentNumber;
    }

    public void setCurrentNumber(Long currentNumber) {
        this.currentNumber = currentNumber;
    }

    public String getTechnicalKey() {
        return technicalKey;
    }

    public void setTechnicalKey(String technicalKey) {
        this.technicalKey = technicalKey;
    }

    public String getResolutionNumber() {
        return resolutionNumber;
    }

    public void setResolutionNumber(String resolutionNumber) {
        this.resolutionNumber = resolutionNumber;
    }

    public LocalDate getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(LocalDate validFrom) {
        this.validFrom = validFrom;
    }

    public LocalDate getValidTo() {
        return validTo;
    }

    public void setValidTo(LocalDate validTo) {
        this.validTo = validTo;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public static DianResolutionBuilder builder() {
        return new DianResolutionBuilder();
    }

    public static class DianResolutionBuilder {
        private Long id;
        private Long tenantId;
        private Long companyId;
        private DianDocumentType documentType;
        private String prefix;
        private Long numberRangeFrom;
        private Long numberRangeTo;
        private Long currentNumber;
        private String technicalKey;
        private String resolutionNumber;
        private LocalDate validFrom;
        private LocalDate validTo;
        private Boolean active = true;

        public DianResolutionBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public DianResolutionBuilder tenantId(Long tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        public DianResolutionBuilder companyId(Long companyId) {
            this.companyId = companyId;
            return this;
        }

        public DianResolutionBuilder documentType(DianDocumentType documentType) {
            this.documentType = documentType;
            return this;
        }

        public DianResolutionBuilder prefix(String prefix) {
            this.prefix = prefix;
            return this;
        }

        public DianResolutionBuilder numberRangeFrom(Long numberRangeFrom) {
            this.numberRangeFrom = numberRangeFrom;
            return this;
        }

        public DianResolutionBuilder numberRangeTo(Long numberRangeTo) {
            this.numberRangeTo = numberRangeTo;
            return this;
        }

        public DianResolutionBuilder currentNumber(Long currentNumber) {
            this.currentNumber = currentNumber;
            return this;
        }

        public DianResolutionBuilder technicalKey(String technicalKey) {
            this.technicalKey = technicalKey;
            return this;
        }

        public DianResolutionBuilder resolutionNumber(String resolutionNumber) {
            this.resolutionNumber = resolutionNumber;
            return this;
        }

        public DianResolutionBuilder validFrom(LocalDate validFrom) {
            this.validFrom = validFrom;
            return this;
        }

        public DianResolutionBuilder validTo(LocalDate validTo) {
            this.validTo = validTo;
            return this;
        }

        public DianResolutionBuilder active(Boolean active) {
            this.active = active;
            return this;
        }

        public DianResolution build() {
            DianResolution resolution = new DianResolution();
            resolution.id = this.id;
            resolution.tenantId = this.tenantId;
            resolution.companyId = this.companyId;
            resolution.documentType = this.documentType;
            resolution.prefix = this.prefix;
            resolution.numberRangeFrom = this.numberRangeFrom;
            resolution.numberRangeTo = this.numberRangeTo;
            resolution.currentNumber = this.currentNumber;
            resolution.technicalKey = this.technicalKey;
            resolution.resolutionNumber = this.resolutionNumber;
            resolution.validFrom = this.validFrom;
            resolution.validTo = this.validTo;
            resolution.active = this.active;
            return resolution;
        }
    }
}
