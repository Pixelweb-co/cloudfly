package co.cloudfly.erp.dian.service;

import co.cloudfly.erp.dian.api.dto.DianCertificateRequest;
import co.cloudfly.erp.dian.api.dto.DianCertificateResponse;
import co.cloudfly.erp.dian.domain.entity.DianCertificate;
import co.cloudfly.erp.dian.domain.repository.DianCertificateRepository;
import co.cloudfly.erp.dian.exception.DianBusinessException;
import co.cloudfly.erp.dian.exception.DianNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Enumeration;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio para gestión de certificados DIAN
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DianCertificateService {

    private final DianCertificateRepository repository;

    @Value("${dian.certificates.storage.path:/opt/cloudfly/certs}")
    private String storagePath;

    /**
     * Lista todos los certificados de un tenant
     */
    @Transactional(readOnly = true)
    public List<DianCertificateResponse> findAllByTenant(Long tenantId) {
        log.info("Buscando certificados para tenant: {}", tenantId);
        return repository.findByTenantId(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lista certificados por tenant y compañía
     */
    @Transactional(readOnly = true)
    public List<DianCertificateResponse> findByTenantAndCompany(Long tenantId, Long companyId) {
        log.info("Buscando certificados para tenant: {} y compañía: {}", tenantId, companyId);
        return repository.findByTenantIdAndCompanyId(tenantId, companyId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un certificado por ID
     */
    @Transactional(readOnly = true)
    public DianCertificateResponse findById(Long id, Long tenantId) {
        DianCertificate cert = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Certificado", id));

        if (!cert.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("El certificado no pertenece a este tenant");
        }

        return toResponse(cert);
    }

    /**
     * Sube y procesa un nuevo certificado
     */
    @Transactional
    public DianCertificateResponse uploadCertificate(
            Long tenantId,
            DianCertificateRequest request,
            MultipartFile file) {

        log.info("Subiendo certificado para tenant: {} y compañía: {}", tenantId, request.companyId());

        if (file == null || file.isEmpty()) {
            throw new DianBusinessException("El archivo del certificado es requerido");
        }

        // Validar extensión
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || (!originalFilename.endsWith(".p12")
                && !originalFilename.endsWith(".pfx")
                && !originalFilename.endsWith(".pem"))) {
            throw new DianBusinessException("Formato de certificado no válido. Use .p12, .pfx o .pem");
        }

        // Validar si ya existe un certificado activo
        if (request.active() && repository.existsActiveCertificate(
                tenantId, request.companyId(), null)) {
            throw new DianBusinessException(
                    "DUPLICATE_ACTIVE_CERTIFICATE",
                    "Ya existe un certificado activo para esta compañía. Desactive el anterior primero.");
        }

        try {
            // Guardar archivo
            String storageKey = saveFile(tenantId, request.companyId(), file);

            // Parsear certificado y extraer metadatos
            CertificateMetadata metadata = parseCertificate(
                    storagePath + "/" + storageKey,
                    request.password(),
                    request.type().name());

            // Crear entidad
            DianCertificate cert = DianCertificate.builder()
                    .tenantId(tenantId)
                    .companyId(request.companyId())
                    .alias(request.alias())
                    .type(request.type())
                    .storageKey(storageKey)
                    .passwordHash(encryptPassword(request.password())) // En producción usar encriptación real
                    .issuer(metadata.issuer)
                    .subject(metadata.subject)
                    .serialNumber(metadata.serialNumber)
                    .validFrom(metadata.validFrom)
                    .validTo(metadata.validTo)
                    .active(request.active())
                    .build();

            DianCertificate saved = repository.save(cert);
            log.info("Certificado guardado con ID: {}", saved.getId());

            return toResponse(saved);

        } catch (Exception e) {
            log.error("Error procesando certificado", e);
            throw new DianBusinessException("Error procesando el certificado: " + e.getMessage(), e);
        }
    }

    /**
     * Activa un certificado (desactivando otros de la misma compañía)
     */
    @Transactional
    public DianCertificateResponse activate(Long id, Long tenantId) {
        log.info("Activando certificado ID: {} para tenant: {}", id, tenantId);

        DianCertificate cert = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Certificado", id));

        if (!cert.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("El certificado no pertenece a este tenant");
        }

        // Desactivar otros certificados de la misma compañía
        repository.findByTenantIdAndCompanyIdAndActiveTrue(tenantId, cert.getCompanyId())
                .ifPresent(activeCert -> {
                    if (!activeCert.getId().equals(id)) {
                        activeCert.setActive(false);
                        repository.save(activeCert);
                        log.info("Certificado anterior ID: {} desactivado", activeCert.getId());
                    }
                });

        // Activar el nuevo
        cert.setActive(true);
        DianCertificate updated = repository.save(cert);

        return toResponse(updated);
    }

    /**
     * Desactiva un certificado
     */
    @Transactional
    public DianCertificateResponse deactivate(Long id, Long tenantId) {
        log.info("Desactivando certificado ID: {}", id);

        DianCertificate cert = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Certificado", id));

        if (!cert.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("El certificado no pertenece a este tenant");
        }

        cert.setActive(false);
        DianCertificate updated = repository.save(cert);

        return toResponse(updated);
    }

    /**
     * Elimina un certificado
     */
    @Transactional
    public void delete(Long id, Long tenantId) {
        log.info("Eliminando certificado ID: {}", id);

        DianCertificate cert = repository.findById(id)
                .orElseThrow(() -> new DianNotFoundException("Certificado", id));

        if (!cert.getTenantId().equals(tenantId)) {
            throw new DianBusinessException("El certificado no pertenece a este tenant");
        }

        // Eliminar archivo físico
        try {
            Path filePath = Paths.get(storagePath, cert.getStorageKey());
            Files.deleteIfExists(filePath);
            log.info("Archivo del certificado eliminado: {}", cert.getStorageKey());
        } catch (Exception e) {
            log.warn("Error eliminando archivo del certificado", e);
        }

        repository.delete(cert);
        log.info("Certificado eliminado de BD: {}", id);
    }

    /**
     * Guarda el archivo del certificado en el sistema de archivos
     */
    private String saveFile(Long tenantId, Long companyId, MultipartFile file) throws Exception {
        // Crear directorio si no existe
        Path directory = Paths.get(storagePath, "tenant-" + tenantId, "company-" + companyId);
        Files.createDirectories(directory);

        // Generar nombre único
        String filename = UUID.randomUUID().toString() + "-" + file.getOriginalFilename();
        Path filePath = directory.resolve(filename);

        // Guardar archivo
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Retornar clave relativa
        return "tenant-" + tenantId + "/company-" + companyId + "/" + filename;
    }

    /**
     * Parsea el certificado y extrae metadatos
     */
    private CertificateMetadata parseCertificate(String filePath, String password, String type) throws Exception {
        CertificateMetadata metadata = new CertificateMetadata();

        if ("P12".equals(type)) {
            // Parsear PKCS#12
            try (InputStream is = new FileInputStream(filePath)) {
                KeyStore keyStore = KeyStore.getInstance("PKCS12");
                keyStore.load(is, password.toCharArray());

                // Obtener primer alias
                Enumeration<String> aliases = keyStore.aliases();
                if (aliases.hasMoreElements()) {
                    String alias = aliases.nextElement();
                    Certificate cert = keyStore.getCertificate(alias);

                    if (cert instanceof X509Certificate) {
                        X509Certificate x509 = (X509Certificate) cert;
                        metadata.issuer = x509.getIssuerDN().toString();
                        metadata.subject = x509.getSubjectDN().toString();
                        metadata.serialNumber = x509.getSerialNumber().toString();
                        metadata.validFrom = LocalDateTime.ofInstant(
                                x509.getNotBefore().toInstant(),
                                ZoneId.systemDefault());
                        metadata.validTo = LocalDateTime.ofInstant(
                                x509.getNotAfter().toInstant(),
                                ZoneId.systemDefault());
                    }
                }
            }
        } else {
            // Para PEM se necesitaría BouncyCastle u otra librería
            // Por ahora dejamos valores por defecto
            log.warn("Parseo de certificados PEM no implementado completamente");
            metadata.issuer = "PEM Certificate";
            metadata.subject = "PEM Certificate";
            metadata.serialNumber = "N/A";
            metadata.validFrom = LocalDateTime.now();
            metadata.validTo = LocalDateTime.now().plusYears(1);
        }

        return metadata;
    }

    /**
     * Encripta la contraseña (en producción usar un algoritmo seguro)
     */
    private String encryptPassword(String password) {
        // TODO: Implementar encriptación real (AES, etc.)
        // Por ahora solo Base64 para demostración
        return java.util.Base64.getEncoder().encodeToString(password.getBytes());
    }

    /**
     * Convierte entidad a DTO
     */
    private DianCertificateResponse toResponse(DianCertificate cert) {
        return new DianCertificateResponse(
                cert.getId(),
                cert.getTenantId(),
                cert.getCompanyId(),
                cert.getAlias(),
                cert.getType(),
                cert.getIssuer(),
                cert.getSubject(),
                cert.getSerialNumber(),
                cert.getValidFrom(),
                cert.getValidTo(),
                cert.getActive(),
                cert.isValid(),
                cert.getCreatedAt(),
                cert.getUpdatedAt());
    }

    /**
     * Clase auxiliar para metadatos del certificado
     */
    private static class CertificateMetadata {
        String issuer;
        String subject;
        String serialNumber;
        LocalDateTime validFrom;
        LocalDateTime validTo;
    }
}
