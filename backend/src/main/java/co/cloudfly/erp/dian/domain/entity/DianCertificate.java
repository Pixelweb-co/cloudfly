package co.cloudfly.erp.dian.domain.entity;

import co.cloudfly.erp.dian.domain.enums.CertificateType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa certificados digitales DIAN
 */
@Entity
@Table(name = "dian_certificates", indexes = {
        @Index(name = "idx_cert_tenant_company", columnList = "tenant_id, company_id"),
        @Index(name = "idx_cert_active", columnList = "active"),
        @Index(name = "idx_cert_validity", columnList = "valid_from, valid_to")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DianCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID del tenant (empresa)
     */
    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    /**
     * ID de la compañía
     */
    @Column(name = "company_id", nullable = false)
    private Long companyId;

    /**
     * Alias o nombre amigable del certificado
     */
    @Column(name = "alias", nullable = false, length = 100)
    private String alias;

    /**
     * Tipo de certificado (P12, PEM)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 10)
    private CertificateType type;

    /**
     * Ruta o clave de almacenamiento del archivo del certificado
     * NO exponer en API
     */
    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    /**
     * Contraseña del certificado (debe estar encriptada)
     * NO exponer en API
     */
    @Column(name = "password_hash", nullable = false, length = 500)
    private String passwordHash;

    /**
     * Emisor del certificado (DN)
     */
    @Column(name = "issuer", length = 500)
    private String issuer;

    /**
     * Sujeto del certificado (DN)
     */
    @Column(name = "subject", length = 500)
    private String subject;

    /**
     * Número de serie del certificado
     */
    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    /**
     * Fecha desde la cual el certificado es válido
     */
    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    /**
     * Fecha hasta la cual el certificado es válido
     */
    @Column(name = "valid_to")
    private LocalDateTime validTo;

    /**
     * Indica si este certificado está activo
     * Solo un certificado activo por (tenant, company)
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
     * Verifica si el certificado está vigente en la fecha actual
     */
    @Transient
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return validFrom != null && validTo != null
                && now.isAfter(validFrom) && now.isBefore(validTo);
    }
}
