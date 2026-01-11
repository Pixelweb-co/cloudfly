package co.cloudfly.dian.core.api;

import co.cloudfly.dian.common.enums.ElectronicDocumentStatus;
import co.cloudfly.dian.common.enums.ElectronicDocumentType;
import co.cloudfly.dian.core.application.dto.ElectronicDocumentResponse;
import co.cloudfly.dian.core.application.service.ElectronicDocumentService;
import co.cloudfly.dian.core.domain.entity.ElectronicDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controlador REST para consultar documentos electrónicos DIAN
 */
@RestController
@RequestMapping("/api/dian/documents")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = { "http://localhost:3000", "http://localhost:8080" })
public class ElectronicDocumentController {

    private final ElectronicDocumentService documentService;

    /**
     * Lista documentos con filtros opcionales
     */
    @GetMapping
    public ResponseEntity<List<ElectronicDocumentResponse>> listDocuments(
            @RequestParam Long tenantId,
            @RequestParam Long companyId,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sourceDocumentId) {

        log.info("Listing documents: tenant={}, company={}, type={}, status={}",
                tenantId, companyId, documentType, status);

        List<ElectronicDocument> documents;

        if (sourceDocumentId != null) {
            // Buscar por ID de origen
            ElectronicDocument doc = documentService.findBySource(tenantId, companyId, sourceDocumentId);
            documents = doc != null ? List.of(doc) : List.of();

        } else if (documentType != null) {
            // Buscar por tipo
            documents = documentService.findByTenantAndCompany(tenantId, companyId).stream()
                    .filter(d -> d.getDocumentType().name().equals(documentType))
                    .collect(Collectors.toList());

        } else {
            // Buscar todos
            documents = documentService.findByTenantAndCompany(tenantId, companyId);
        }

        // Filtrar por status si se proporciona
        if (status != null) {
            documents = documents.stream()
                    .filter(d -> d.getStatus().name().equals(status))
                    .collect(Collectors.toList());
        }

        List<ElectronicDocumentResponse> responses = documents.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * Obtiene un documento por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ElectronicDocumentResponse> getDocument(@PathVariable Long id) {
        log.info("Getting document by ID: {}", id);

        ElectronicDocument document = documentService.findById(id);

        if (document == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(toResponseWithXml(document));
    }

    /**
     * Obtiene un documento por su ID de origen en el ERP
     */
    @GetMapping("/by-source")
    public ResponseEntity<ElectronicDocumentResponse> getBySource(
            @RequestParam Long tenantId,
            @RequestParam Long companyId,
            @RequestParam String sourceDocumentId) {

        log.info("Getting document by source: tenant={}, company={}, sourceId={}",
                tenantId, companyId, sourceDocumentId);

        ElectronicDocument document = documentService.findBySource(tenantId, companyId, sourceDocumentId);

        if (document == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(toResponseWithXml(document));
    }

    /**
     * Convierte entidad a DTO (sin XMLs)
     */
    private ElectronicDocumentResponse toResponse(ElectronicDocument doc) {
        return ElectronicDocumentResponse.builder()
                .id(doc.getId())
                .eventId(doc.getEventId())
                .documentType(doc.getDocumentType().name())
                .status(doc.getStatus().name())
                .tenantId(doc.getTenantId())
                .companyId(doc.getCompanyId())
                .sourceSystem(doc.getSourceSystem())
                .sourceDocumentId(doc.getSourceDocumentId())
                .dianDocumentNumber(doc.getDianDocumentNumber())
                .cufeOrCune(doc.getCufeOrCune())
                .environment(doc.getEnvironment())
                .errorCode(doc.getErrorCode())
                .errorMessage(doc.getErrorMessage())
                .createdAt(doc.getCreatedAt())
                .processedAt(doc.getProcessedAt())
                .build();
    }

    /**
     * Convierte entidad a DTO (con XMLs en Base64)
     */
    private ElectronicDocumentResponse toResponseWithXml(ElectronicDocument doc) {
        ElectronicDocumentResponse response = toResponse(doc);

        // Agregar XMLs codificados en Base64
        if (doc.getXmlSigned() != null) {
            response.setXmlSigned(Base64.getEncoder().encodeToString(doc.getXmlSigned()));
        }

        if (doc.getXmlResponse() != null) {
            response.setXmlResponse(Base64.getEncoder().encodeToString(doc.getXmlResponse()));
        }

        return response;
    }
}
