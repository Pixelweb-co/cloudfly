package co.cloudfly.erp.dian.domain.entity;

import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import co.cloudfly.erp.dian.domain.enums.DianEnvironment;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa la configuración de modos de operación DIAN
 * para cada tipo de documento por empresa (tenant)
 */
@Entity
@Table(name = "dian_operation_modes", uniqueConstraints = @UniqueConstraint(name = "uk_operation_mode", columnNames = {
                "tenant_id", "company_id", "document_type", "environment", "active" }), indexes = {
                                @Index(name = "idx_tenant_company", columnList = "tenant_id, company_id"),
                                @Index(name = "idx_document_type", columnList = "document_type"),
                                @Index(name = "idx_active", columnList = "active")
                })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DianOperationMode {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        /**
         * ID del tenant (empresa) al que pertenece esta configuración
         */
        @Column(name = "tenant_id", nullable = false)
        private Long tenantId;

        /**
         * ID de la empresa/compañía dentro del tenant
         */
        @Column(name = "company_id", nullable = false)
        private Long companyId;

        /**
         * Tipo de documento (INVOICE, CREDIT_NOTE, etc.)
         */
        @Enumerated(EnumType.STRING)
        @Column(name = "document_type", nullable = false, length = 50)
        private DianDocumentType documentType;

        /**
         * Ambiente de operación (TEST, PRODUCTION)
         */
        @Enumerated(EnumType.STRING)
        @Column(name = "environment", nullable = false, length = 20)
        private DianEnvironment environment;

        /**
         * Software ID proporcionado por la DIAN
         */
        @Column(name = "software_id", nullable = false, length = 100)
        private String softwareId;

        /**
         * PIN del software DIAN
         */
        @Column(name = "pin", nullable = false, length = 10)
        private String pin;

        /**
         * Test Set ID para ambiente de habilitación
         */
        @Column(name = "test_set_id", length = 100)
        private String testSetId;

        /**
         * Indica si está en proceso de certificación
         */
        @Column(name = "certification_process", nullable = false)
        @Builder.Default
        private Boolean certificationProcess = false;

        /**
         * Indica si este modo está activo
         * Solo puede haber un modo activo por combinación (tenant, company, docType,
         * environment)
         */
        @Column(name = "active", nullable = false)
        @Builder.Default
        private Boolean active = true;

        /**
         * Fecha de creación
         */
        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        /**
         * Fecha de última actualización
         */
        @UpdateTimestamp
        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        // Manual getters and setters
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

        public DianEnvironment getEnvironment() {
                return environment;
        }

        public void setEnvironment(DianEnvironment environment) {
                this.environment = environment;
        }

        public String getSoftwareId() {
                return softwareId;
        }

        public void setSoftwareId(String softwareId) {
                this.softwareId = softwareId;
        }

        public String getPin() {
                return pin;
        }

        public void setPin(String pin) {
                this.pin = pin;
        }

        public String getTestSetId() {
                return testSetId;
        }

        public void setTestSetId(String testSetId) {
                this.testSetId = testSetId;
        }

        public Boolean getCertificationProcess() {
                return certificationProcess;
        }

        public void setCertificationProcess(Boolean certificationProcess) {
                this.certificationProcess = certificationProcess;
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
}
