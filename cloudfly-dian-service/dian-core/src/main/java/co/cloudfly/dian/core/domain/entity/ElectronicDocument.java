package co.cloudfly.dian.core.domain.entity;

import co.cloudfly.dian.common.enums.ElectronicDocumentStatus;
import co.cloudfly.dian.common.enums.ElectronicDocumentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "electronic_documents", indexes = {
        @Index(name = "idx_tenant_company", columnList = "tenant_id, company_id"),
        @Index(name = "idx_event_id", columnList = "event_id", unique = true),
        @Index(name = "idx_source", columnList = "source_system, source_document_id"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_cufe", columnList = "cufe_or_cune")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ElectronicDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true, length = 100)
    private String eventId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private ElectronicDocumentType documentType;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "source_system", length = 50)
    private String sourceSystem;

    @Column(name = "source_document_id", length = 100)
    private String sourceDocumentId;

    @Column(name = "dian_document_number", length = 100)
    private String dianDocumentNumber;

    @Column(name = "cufe_or_cune", length = 500)
    private String cufeOrCune;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ElectronicDocumentStatus status;

    @Column(name = "environment", length = 20)
    private String environment; // TEST or PRODUCTION

    @Lob
    @Column(name = "xml_signed", columnDefinition = "LONGBLOB")
    private byte[] xmlSigned;

    @Lob
    @Column(name = "xml_response", columnDefinition = "LONGBLOB")
    private byte[] xmlResponse;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Lob
    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson; // JSON del payload completo

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
