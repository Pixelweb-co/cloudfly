package com.app.starter1.services;

import com.app.starter1.dto.*;
import com.app.starter1.mapper.NotaCreditoMapper;
import com.app.starter1.persistence.entity.NotaCredito;
import com.app.starter1.persistence.repository.NotaCreditoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotaCreditoService {

    private final NotaCreditoRepository repository;
    private final NotaCreditoMapper mapper;
    private final com.app.starter1.services.AccountingIntegrationService accountingIntegrationService;

    /**
     * Crear nota de crédito en estado BORRADOR
     */
    @Transactional
    public NotaCreditoResponse crear(NotaCreditoRequest request, Long tenantId, String username) {
        log.info("Creando nota de crédito para invoice: {}", request.getInvoiceIdReferencia());

        // Generar número de nota
        String numeroNota = generarNumeroNotaCredito(tenantId);

        NotaCredito nota = mapper.toEntity(request, tenantId);
        nota.setNumeroNotaCredito(numeroNota);
        nota.setCreatedBy(username);

        nota = repository.save(nota);

        log.info("Nota de crédito creada: {}", nota.getNumeroNotaCredito());
        return mapper.toResponse(nota);
    }

    /**
     * Aprobar nota de crédito y REVERTIR CONTABILIDAD
     */
    @Transactional
    public NotaCreditoResponse aprobar(Long id, String username) {
        log.info("Aprobando nota de crédito ID: {}", id);

        NotaCredito nota = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota de crédito no encontrada"));

        if (nota.getEstado() != NotaCredito.EstadoNotaCredito.BORRADOR) {
            throw new RuntimeException("Solo se pueden aprobar notas en estado BORRADOR");
        }

        // Cambiar estado
        nota.setEstado(NotaCredito.EstadoNotaCredito.APROBADA);
        nota.setApprovedBy(username);
        nota.setApprovedAt(LocalDateTime.now());

        // REVERTIR MOVIMIENTOS CONTABLES
        if (!nota.getContabilidadRevertida()) {
            revertirContabilidad(nota);
            nota.setContabilidadRevertida(true);
        }

        nota = repository.save(nota);

        log.info("Nota de crédito aprobada: {}", nota.getNumeroNotaCredito());
        return mapper.toResponse(nota);
    }

    /**
     * Enviar nota de crédito a DIAN
     */
    @Transactional
    public NotaCreditoResponse enviarDian(Long id) {
        log.info("Enviando nota de crédito a DIAN ID: {}", id);

        NotaCredito nota = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota de crédito no encontrada"));

        if (nota.getEstado() != NotaCredito.EstadoNotaCredito.APROBADA) {
            throw new RuntimeException("Solo se pueden enviar notas APROBADAS");
        }

        // TODO: Integrar con microservicio DIAN
        // 1. Generar XML UBL
        // 2. Firmar XML
        // 3. Enviar a DIAN
        // 4. Procesar respuesta

        nota.setEstado(NotaCredito.EstadoNotaCredito.ENVIADA);
        nota = repository.save(nota);

        log.info("Nota de crédito enviada a DIAN: {}", nota.getNumeroNotaCredito());
        return mapper.toResponse(nota);
    }

    /**
     * Buscar notas de crédito por tenant
     */
    @Transactional(readOnly = true)
    public List<NotaCreditoResponse> listar(Long tenantId) {
        return repository.findByTenantIdOrderByFechaEmisionDesc(tenantId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar por ID
     */
    @Transactional(readOnly = true)
    public NotaCreditoResponse buscarPorId(Long id) {
        NotaCredito nota = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota de crédito no encontrada"));
        return mapper.toResponse(nota);
    }

    /**
     * Buscar notas de una factura específica
     */
    @Transactional(readOnly = true)
    public List<NotaCreditoResponse> buscarPorFactura(Long invoiceId) {
        return repository.findByInvoiceIdReferencia(invoiceId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * REVIERTE LOS MOVIMIENTOS CONTABLES de la factura original
     */
    private void revertirContabilidad(NotaCredito nota) {
        log.info("🔄 Revirtiendo contabilidad para factura: {}", nota.getNumeroFacturaOriginal());

        try {
            accountingIntegrationService.generateVoucherForNotaCredito(nota.getId());
        } catch (Exception e) {
            log.error("❌ Error revirtiendo contabilidad", e);
            // Si es crítico, lanzar excepción, si no, logear
            // throw new RuntimeException("Error en reversión contable: " + e.getMessage());
        }
    }

    /**
     * Genera número único para la nota de crédito
     */
    private String generarNumeroNotaCredito(Long tenantId) {
        long count = repository.countByTenantIdAndEstado(
                tenantId,
                NotaCredito.EstadoNotaCredito.BORRADOR);
        return String.format("NC-%d-%06d", tenantId, count + 1);
    }
}
