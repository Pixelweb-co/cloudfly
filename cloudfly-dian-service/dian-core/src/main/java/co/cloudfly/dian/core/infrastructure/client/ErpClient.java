package co.cloudfly.dian.core.infrastructure.client;

import co.cloudfly.dian.core.application.dto.DianOperationModeResponse;
import co.cloudfly.dian.core.application.dto.DianResolutionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Cliente REST para consultar configuración DIAN al ERP principal
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ErpClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${erp.api.base-url}")
    private String erpBaseUrl;

    @Value("${erp.api.timeout:30000}")
    private int timeout;

    /**
     * Obtiene el modo de operación DIAN activo para un tipo de documento
     */
    public DianOperationModeResponse getActiveOperationMode(
            Long tenantId,
            Long companyId,
            String documentType) {

        log.info("Fetching active operation mode: tenant={}, company={}, docType={}",
                tenantId, companyId, documentType);

        try {
            WebClient webClient = webClientBuilder
                    .baseUrl(erpBaseUrl)
                    .build();

            DianOperationModeResponse response = webClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/settings/dian/operation-modes/active")
                            .queryParam("tenantId", tenantId)
                            .queryParam("companyId", companyId)
                            .queryParam("documentType", documentType)
                            .build())
                    .retrieve()
                    .bodyToMono(DianOperationModeResponse.class)
                    .block();

            log.info("Operation mode retrieved: {}", response != null ? response.getId() : "null");
            return response;

        } catch (Exception e) {
            log.error("Error fetching operation mode from ERP", e);
            throw new RuntimeException("Failed to fetch operation mode", e);
        }
    }

    /**
     * Obtiene la resolución DIAN activa para un tipo de documento y prefijo
     */
    public DianResolutionResponse getActiveResolution(
            Long tenantId,
            Long companyId,
            String documentType,
            String prefix) {

        log.info("Fetching active resolution: tenant={}, company={}, docType={}, prefix={}",
                tenantId, companyId, documentType, prefix);

        try {
            WebClient webClient = webClientBuilder
                    .baseUrl(erpBaseUrl)
                    .build();

            DianResolutionResponse response = webClient
                    .get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/settings/dian/resolutions/active")
                            .queryParam("tenantId", tenantId)
                            .queryParam("companyId", companyId)
                            .queryParam("documentType", documentType)
                            .queryParam("prefix", prefix)
                            .build())
                    .retrieve()
                    .bodyToMono(DianResolutionResponse.class)
                    .block();

            log.info("Resolution retrieved: {}", response != null ? response.getId() : "null");
            return response;

        } catch (Exception e) {
            log.error("Error fetching resolution from ERP", e);
            throw new RuntimeException("Failed to fetch resolution", e);
        }
    }

    /**
     * Obtiene el certificado digital activo
     * En este caso, el certificado se obtiene junto con el operation mode
     */
    public String getCertificatePath(Long tenantId, Long companyId) {
        log.info("Fetching certificate path: tenant={}, company={}", tenantId, companyId);

        try {
            WebClient webClient = webClientBuilder
                    .baseUrl(erpBaseUrl)
                    .build();

            // En una implementación real, esto devolvería metadatos del certificado
            // Por ahora, asumimos que el path viene en el operation mode
            return "/opt/cloudfly/certs/tenant-" + tenantId + "/company-" + companyId + "/cert.p12";

        } catch (Exception e) {
            log.error("Error fetching certificate path", e);
            throw new RuntimeException("Failed to fetch certificate", e);
        }
    }
}
