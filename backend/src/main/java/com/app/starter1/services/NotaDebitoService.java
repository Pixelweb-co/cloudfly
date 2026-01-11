package com.app.starter1.services;

import com.app.starter1.dto.*;
import com.app.starter1.mapper.NotaDebitoMapper;
import com.app.starter1.persistence.entity.NotaDebito;
import com.app.starter1.persistence.repository.NotaDebitoRepository;
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
public class NotaDebitoService {

    private final NotaDebitoRepository repository;
    private final NotaDebitoMapper mapper;
    // TODO: Inyectar servicio contable cuando esté disponible
    // private final AccountingService accountingService;

    /**
     * Crear nota de débito en estado BORRADOR
     */
    @Transactional
    public NotaDebitoResponse crear(NotaDebitoRequest request, Long tenantId, String username) {
        log.info("Creando nota de débito para invoice: {}", request.getInvoiceIdReferencia());

        // Generar número de nota
        String numeroNota = generarNumeroNotaDebito(tenantId);

        NotaDebito nota = mapper.toEntity(request, tenantId);
        nota.setNumeroNotaDebito(numeroNota);
        nota.setCreatedBy(username);

        nota = repository.save(nota);

        log.info("Nota de débito creada: {}", nota.getNumeroNotaDebito());
        return mapper.toResponse(nota);
    }

    /**
     * Aprobar nota de débito y GENERAR CONTABILIDAD
     */
    @Transactional
    public NotaDebitoResponse aprobar(Long id, String username) {
        log.info("Aprobando nota de débito ID: {}", id);

        NotaDebito nota = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota de débito no encontrada"));

        if (nota.getEstado() != NotaDebito.EstadoNotaDebito.BORRADOR) {
            throw new RuntimeException("Solo se pueden aprobar notas en estado BORRADOR");
        }

        // Cambiar estado
        nota.setEstado(NotaDebito.EstadoNotaDebito.APROBADA);
        nota.setApprovedBy(username);
        nota.setApprovedAt(LocalDateTime.now());

        // GENERAR MOVIMIENTOS CONTABLES
        if (!nota.getContabilidadGenerada()) {
            generarContabilidad(nota);
            nota.setContabilidadGenerada(true);
        }

        nota = repository.save(nota);

        log.info("Nota de débito aprobada: {}", nota.getNumeroNotaDebito());
        return mapper.toResponse(nota);
    }

    /**
     * Enviar nota de débito a DIAN
     */
    @Transactional
    public NotaDebitoResponse enviarDian(Long id) {
        log.info("Enviando nota de débito a DIAN ID: {}", id);

        NotaDebito nota = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota de débito no encontrada"));

        if (nota.getEstado() != NotaDebito.EstadoNotaDebito.APROBADA) {
            throw new RuntimeException("Solo se pueden enviar notas APROBADAS");
        }

        // TODO: Integrar con microservicio DIAN
        // 1. Generar XML UBL
        // 2. Firmar XML
        // 3. Enviar a DIAN
        // 4. Procesar respuesta

        nota.setEstado(NotaDebito.EstadoNotaDebito.ENVIADA);
        nota = repository.save(nota);

        log.info("Nota de débito enviada a DIAN: {}", nota.getNumeroNotaDebito());
        return mapper.toResponse(nota);
    }

    /**
     * Buscar notas de débito por tenant
     */
    @Transactional(readOnly = true)
    public List<NotaDebitoResponse> listar(Long tenantId) {
        return repository.findByTenantIdOrderByFechaEmisionDesc(tenantId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Buscar por ID
     */
    @Transactional(readOnly = true)
    public NotaDebitoResponse buscarPorId(Long id) {
        NotaDebito nota = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota de débito no encontrada"));
        return mapper.toResponse(nota);
    }

    /**
     * Buscar notas de una factura específica
     */
    @Transactional(readOnly = true)
    public List<NotaDebitoResponse> buscarPorFactura(Long invoiceId) {
        return repository.findByInvoiceIdReferencia(invoiceId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * GENERA MOVIMIENTOS CONTABLES adicionales por la nota de débito
     */
    private void generarContabilidad(NotaDebito nota) {
        log.info("💰 Generando contabilidad para nota de débito: {}", nota.getNumeroNotaDebito());

        try {
            // TODO: Implementar integración con módulo contable
            // Ejemplo conceptual:
            /*
             * // 1. Crear asiento contable por el valor adicional
             * AsientoContable asiento = new AsientoContable();
             * asiento.setTenantId(nota.getTenantId());
             * asiento.setFecha(nota.getFechaEmision());
             * asiento.setConcepto("Nota Débito " + nota.getNumeroNotaDebito());
             * 
             * // 2. Débito: Aumentar cuentas por cobrar
             * asiento.addDetalle(
             * cuentaCxC, // 1305 Clientes
             * nota.getTotal(),
             * "DEBITO"
             * );
             * 
             * // 3. Crédito: Reconocer ingreso adicional
             * asiento.addDetalle(
             * cuentaIngresos, // 4135 Comercio
             * nota.getTotal(),
             * "CREDITO"
             * );
             * 
             * // 4. Guardar asiento
             * asiento = accountingService.save(asiento);
             * nota.setAsientoContableId(asiento.getId());
             * 
             * log.info("✅ Contabilidad generada. Asiento: {}", asiento.getNumero());
             */

            // Por ahora solo registramos el log
            log.warn("⚠️ Integración contable pendiente de implementar");

        } catch (Exception e) {
            log.error("❌ Error generando contabilidad", e);
            throw new RuntimeException("Error en generación contable: " + e.getMessage());
        }
    }

    /**
     * Genera número único para la nota de débito
     */
    private String generarNumeroNotaDebito(Long tenantId) {
        long count = repository.countByTenantIdAndEstado(
                tenantId,
                NotaDebito.EstadoNotaDebito.BORRADOR);
        return String.format("ND-%d-%06d", tenantId, count + 1);
    }
}
