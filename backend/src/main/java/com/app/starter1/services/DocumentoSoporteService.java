package com.app.starter1.services;

import com.app.starter1.dto.DocumentoSoporteRequest;
import com.app.starter1.dto.DocumentoSoporteResponse;
import com.app.starter1.dto.DocumentoSoporteItemDTO;
import com.app.starter1.events.ElectronicDocumentEvent;
import com.app.starter1.persistence.entity.DocumentoSoporte;
import com.app.starter1.persistence.entity.DocumentoSoporteItem;
import com.app.starter1.persistence.entity.Proveedor;
import com.app.starter1.persistence.repository.DocumentoSoporteRepository;
import com.app.starter1.persistence.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentoSoporteService {

    private final DocumentoSoporteRepository repository;
    private final ProveedorRepository proveedorRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final AccountingIntegrationService accountingIntegrationService;

    private static final String TOPIC_DIAN_DOCUMENTS = "dian-documents"; // Verify topic name

    @Transactional
    public DocumentoSoporteResponse crear(DocumentoSoporteRequest request, Long tenantId, String username) {
        Proveedor proveedor = proveedorRepository.findById(request.getProveedorId())
                .orElseThrow(() -> new RuntimeException("Proveedor no encontrado"));

        DocumentoSoporte doc = new DocumentoSoporte();
        doc.setTenantId(tenantId);
        doc.setFecha(request.getFecha());
        doc.setProveedorId(proveedor.getId());

        // Snapshot logic
        doc.setProveedorTipoDocumento(proveedor.getTipoDocumento());
        doc.setProveedorNumeroDocumento(proveedor.getNumeroDocumento());
        doc.setProveedorRazonSocial(proveedor.getRazonSocial());
        doc.setProveedorDireccion(proveedor.getDireccion());
        doc.setProveedorCiudad(proveedor.getCiudad());
        doc.setProveedorDepartamento(proveedor.getDepartamento());
        doc.setProveedorEmail(proveedor.getEmail());

        doc.setEstado("BORRADOR");
        doc.setAmbienteDian("2"); // Default Test
        doc.setCreatedBy(username);

        // Generate temporary number
        doc.setNumeroDocumento("TMP-" + System.currentTimeMillis());

        // Items
        List<DocumentoSoporteItem> items = request.getItems().stream().map(itemReq -> {
            DocumentoSoporteItem item = new DocumentoSoporteItem();
            item.setDocumentoSoporte(doc);
            item.setProductName(itemReq.getProductName());
            item.setDescripcion(itemReq.getDescripcion());
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(itemReq.getUnitPrice());
            item.setUnidadMedida(itemReq.getUnidadMedida());
            item.setPorcentajeImpuesto(
                    itemReq.getPorcentajeImpuesto() != null ? itemReq.getPorcentajeImpuesto() : BigDecimal.ZERO);

            // Calculations
            BigDecimal sub = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setSubtotal(sub);

            // Tax
            if (item.getPorcentajeImpuesto().compareTo(BigDecimal.ZERO) > 0) {
                item.setImpuestoCalculado(sub.multiply(item.getPorcentajeImpuesto().divide(BigDecimal.valueOf(100))));
            } else {
                item.setImpuestoCalculado(BigDecimal.ZERO);
            }

            item.setTotal(sub.add(item.getImpuestoCalculado()));
            return item;
        }).collect(Collectors.toList());

        doc.setItems(items);
        doc.calculateTotals();

        DocumentoSoporte saved = repository.save(doc);

        // Update number with ID if needed or keep TMP until approval
        saved.setNumeroDocumento("DS-" + saved.getId());
        saved = repository.save(saved);

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DocumentoSoporteResponse> listar(Long tenantId) {
        return repository.findByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DocumentoSoporteResponse buscarPorId(Long id) {
        return repository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));
    }

    @Transactional
    public DocumentoSoporteResponse aprobar(Long id, String username) {
        DocumentoSoporte doc = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

        if (!"BORRADOR".equals(doc.getEstado())) {
            throw new RuntimeException("El documento no está en estado BORRADOR");
        }

        // Validations
        // ...

        doc.setEstado("APROBADO"); // Step 1: internal approval
        // doc.setApprovedBy(username); // Removed as per instruction
        // doc.setApprovedAt(java.time.LocalDateTime.now()); // Removed as per
        // instruction

        DocumentoSoporte saved = repository.save(doc);

        // Trigger DIAN Event
        enviarADian(saved);

        // Generate Accounting
        try {
            accountingIntegrationService.generateVoucherForDocumentoSoporte(saved.getId());
        } catch (Exception e) {
            log.error("Error generating accounting for DS {}", saved.getId(), e);
        }

        return mapToResponse(saved);
    }

    // Explicit trigger method
    public void enviarADian(DocumentoSoporte doc) {
        try {
            ElectronicDocumentEvent event = ElectronicDocumentEvent.builder()
                    .documentId(doc.getId().toString())
                    .documentNumber(doc.getNumeroDocumento())
                    .documentType("SUPPORT_DOCUMENT")
                    .tenantId(doc.getTenantId())
                    .environment(doc.getAmbienteDian())
                    .issuedAt(LocalDateTime.now())
                    .payload(buildPayload(doc))
                    .build();

            // Serialize and send
            String jsonEvent = objectMapper.writeValueAsString(event);
            log.info("Enviando evento DIAN: {}", jsonEvent);
            kafkaTemplate.send(TOPIC_DIAN_DOCUMENTS, jsonEvent);

            doc.setEstado("ENVIADO");
            repository.save(doc);

        } catch (Exception e) {
            log.error("Error enviando evento DIAN", e);
            // Don't fail the transaction, just log.
            // Or maybe fail if critical.
        }
    }

    private Map<String, Object> buildPayload(DocumentoSoporte doc) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("supplierNit", doc.getProveedorNumeroDocumento());
        payload.put("total", doc.getTotal());
        // ... more fields
        return payload;
    }

    private DocumentoSoporteResponse mapToResponse(DocumentoSoporte doc) {
        DocumentoSoporteResponse res = new DocumentoSoporteResponse();
        res.setId(doc.getId());
        res.setTenantId(doc.getTenantId());
        res.setNumeroDocumento(doc.getNumeroDocumento());
        res.setCuds(doc.getCuds());
        res.setFecha(doc.getFecha());
        res.setProveedorId(doc.getProveedorId());
        res.setProveedorRazonSocial(doc.getProveedorRazonSocial());
        res.setProveedorNit(doc.getProveedorNumeroDocumento());
        res.setSubtotal(doc.getSubtotal());
        res.setTotalDescuentos(doc.getTotalDescuentos());
        res.setTotalImpuestos(doc.getTotalImpuestos());
        res.setTotal(doc.getTotal());
        res.setEstado(doc.getEstado());
        res.setEstado(doc.getEstado());
        res.setMensajeDian(doc.getMensajeDian());

        res.setAccountingGenerated(doc.getAccountingGenerated());
        res.setAccountingVoucherId(doc.getAccountingVoucherId());

        res.setItems(doc.getItems().stream().map(i -> {
            DocumentoSoporteItemDTO item = new DocumentoSoporteItemDTO();
            item.setId(i.getId());
            item.setProductName(i.getProductName());
            item.setQuantity(i.getQuantity());
            item.setUnitPrice(i.getUnitPrice());
            item.setTotal(i.getTotal());
            item.setUnidadMedida(i.getUnidadMedida());
            item.setPorcentajeImpuesto(i.getPorcentajeImpuesto());
            return item;
        }).collect(Collectors.toList()));

        return res;
    }
}
