package com.app.starter1.controllers;

import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.services.SystemConfigService;
import com.app.starter1.utils.UserMethods;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.*;

/**
 * Controller para manejar OAuth 2.0 de Facebook Messenger
 * 
 * Flujo:
 * 1. Frontend llama a /auth-url para obtener la URL de autorización
 * 2. Usuario autoriza en Facebook
 * 3. Facebook redirige a /callback con el código
 * 4. Backend intercambia código por access token
 * 5. Backend obtiene las páginas del usuario
 * 6. Frontend muestra selector de páginas
 * 7. Frontend confirma la página a conectar
 * 8. Backend guarda el canal con Page Access Token
 */
@Slf4j
@RestController
@RequestMapping("/api/channels/facebook")
@RequiredArgsConstructor
public class FacebookOAuthController {

    private final SystemConfigService systemConfigService;
    private final CustomerRepository customerRepository;
    private final ChannelRepository channelRepository;
    private final UserMethods userMethods;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * GET /api/channels/facebook/auth-url
     * Generar URL de autorización para iniciar el flujo OAuth
     */
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthorizationUrl() {
        try {
            log.info("🔑 [FB-OAUTH] Generating authorization URL");

            // Usar configuración interna con secretos reales
            SystemConfigDTO config = systemConfigService.getSystemConfigInternal();

            // Validar que la integración de Facebook esté habilitada
            if (config.getFacebookEnabled() == null || !config.getFacebookEnabled()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook integration is not enabled"));
            }

            // Validar que existan las credenciales
            if (config.getFacebookAppId() == null || config.getFacebookRedirectUri() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook App ID or Redirect URI not configured"));
            }

            Long tenantId = userMethods.getTenantId();

            // Generar state token para CSRF protection
            String state = generateStateToken(tenantId);

            // Permisos necesarios para Messenger
            String scopes = String.join(",", List.of(
                    "pages_show_list", // Ver lista de páginas
                    "pages_messaging", // Enviar/recibir mensajes
                    "pages_manage_metadata", // Suscribir webhooks
                    "pages_read_engagement", // Leer interacciones
                    "email" // Email del usuario (opcional)
            ));

            // Construir URL de autorización
            String authUrl = UriComponentsBuilder
                    .fromHttpUrl("https://www.facebook.com/" + config.getFacebookApiVersion() + "/dialog/oauth")
                    .queryParam("client_id", config.getFacebookAppId())
                    .queryParam("redirect_uri", config.getFacebookRedirectUri())
                    .queryParam("state", state)
                    .queryParam("scope", scopes)
                    .queryParam("response_type", "code")
                    .build()
                    .toUriString();

            log.info("✅ [FB-OAUTH] Authorization URL generated for tenant: {}", tenantId);

            return ResponseEntity.ok(Map.of(
                    "authUrl", authUrl,
                    "state", state));

        } catch (Exception e) {
            log.error("❌ [FB-OAUTH] Error generating auth URL: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to generate authorization URL"));
        }
    }

    /**
     * GET /api/channels/facebook/callback
     * Callback de Facebook después de autorización
     * 
     * @param code  Código de autorización de Facebook
     * @param state Token CSRF para validar la solicitud
     */
    @GetMapping("/callback")
    public ResponseEntity<?> handleOAuthCallback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription) {

        log.info("📥 [FB-OAUTH] Received callback with code: {}", code != null ? "present" : "missing");

        // Manejar error de autorización
        if (error != null) {
            log.error("❌ [FB-OAUTH] Authorization error: {} - {}", error, errorDescription);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("/comunicaciones/canales?error=" + error))
                    .build();
        }

        try {
            // Validar state token
            Long tenantId = validateStateToken(state);
            if (tenantId == null) {
                log.error("❌ [FB-OAUTH] Invalid state token");
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create("/comunicaciones/canales?error=invalid_state"))
                        .build();
            }

            // Usar configuración interna con secretos reales
            SystemConfigDTO config = systemConfigService.getSystemConfigInternal();

            // 1. Intercambiar código por access token de corta duración
            String shortLivedToken = exchangeCodeForToken(
                    code,
                    config.getFacebookAppId(),
                    config.getFacebookAppSecret(),
                    config.getFacebookRedirectUri());

            log.info("✅ [FB-OAUTH] Short-lived token obtained");

            // 2. Intercambiar por token de larga duración
            String longLivedToken = exchangeForLongLivedToken(
                    shortLivedToken,
                    config.getFacebookAppId(),
                    config.getFacebookAppSecret());

            log.info("✅ [FB-OAUTH] Long-lived token obtained");

            // 3. Obtener las páginas del usuario
            List<Map<String, Object>> pages = getUserPages(longLivedToken);

            log.info("✅ [FB-OAUTH] Found {} pages", pages.size());

            // 4. Por ahora, conectamos la primera página automáticamente
            // TODO: En el futuro, mostrar selector de páginas en el frontend
            if (pages.isEmpty()) {
                log.warn("⚠️ [FB-OAUTH] User has no pages");
                return ResponseEntity.status(HttpStatus.FOUND)
                        .location(URI.create("/comunicaciones/canales?error=no_pages"))
                        .build();
            }

            Map<String, Object> selectedPage = pages.get(0);
            String pageId = (String) selectedPage.get("id");
            String pageName = (String) selectedPage.get("name");
            String pageAccessToken = (String) selectedPage.get("access_token");

            // 5. Suscribir webhooks a la página
            boolean webhookSubscribed = subscribePageToWebhooks(pageId, pageAccessToken);

            if (!webhookSubscribed) {
                log.error("❌ [FB-OAUTH] Failed to subscribe webhooks for page: {}", pageId);
            }

            // 6. Guardar el canal en la base de datos
            Customer customer = customerRepository.findById(tenantId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            // Verificar si ya existe un canal para esta página
            Optional<Channel> existingChannel = channelRepository
                    .findByCustomerAndTypeAndPageId(customer, Channel.ChannelType.FACEBOOK, pageId);

            Channel channel;
            if (existingChannel.isPresent()) {
                channel = existingChannel.get();
                log.info("🔄 [FB-OAUTH] Updating existing channel for page: {}", pageId);
            } else {
                channel = new Channel();
                channel.setCustomer(customer);
                channel.setType(Channel.ChannelType.FACEBOOK);
                log.info("🆕 [FB-OAUTH] Creating new channel for page: {}", pageId);
            }

            channel.setName("Facebook - " + pageName);
            channel.setPageId(pageId);
            channel.setAccessToken(pageAccessToken);
            channel.setIsActive(true);
            channel.setIsConnected(true);

            channelRepository.save(channel);

            log.info("✅ [FB-OAUTH] Channel saved successfully. Page: {} - {}", pageId, pageName);

            // Redirigir al frontend con éxito
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("/comunicaciones/canales?success=facebook_connected"))
                    .build();

        } catch (Exception e) {
            log.error("❌ [FB-OAUTH] Error processing callback: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("/comunicaciones/canales?error=connection_failed"))
                    .build();
        }
    }

    /**
     * Intercambiar código de autorización por access token
     */
    private String exchangeCodeForToken(String code, String appId, String appSecret, String redirectUri) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://graph.facebook.com/v18.0/oauth/access_token")
                .queryParam("client_id", appId)
                .queryParam("client_secret", appSecret)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("code", code)
                .build()
                .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body == null || !body.containsKey("access_token")) {
            throw new RuntimeException("Failed to exchange code for token");
        }

        return (String) body.get("access_token");
    }

    /**
     * Intercambiar token de corta duración por uno de larga duración
     */
    private String exchangeForLongLivedToken(String shortLivedToken, String appId, String appSecret) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://graph.facebook.com/v18.0/oauth/access_token")
                .queryParam("grant_type", "fb_exchange_token")
                .queryParam("client_id", appId)
                .queryParam("client_secret", appSecret)
                .queryParam("fb_exchange_token", shortLivedToken)
                .build()
                .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body == null || !body.containsKey("access_token")) {
            throw new RuntimeException("Failed to exchange for long-lived token");
        }

        return (String) body.get("access_token");
    }

    /**
     * Obtener las páginas del usuario
     */
    private List<Map<String, Object>> getUserPages(String userAccessToken) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://graph.facebook.com/v18.0/me/accounts")
                .queryParam("access_token", userAccessToken)
                .build()
                .toUriString();

        ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
        Map<String, Object> body = response.getBody();

        if (body == null || !body.containsKey("data")) {
            return Collections.emptyList();
        }

        return (List<Map<String, Object>>) body.get("data");
    }

    /**
     * Suscribir la página a los webhooks
     */
    private boolean subscribePageToWebhooks(String pageId, String pageAccessToken) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl("https://graph.facebook.com/v18.0/" + pageId + "/subscribed_apps")
                    .queryParam("subscribed_fields",
                            "messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads")
                    .queryParam("access_token", pageAccessToken)
                    .build()
                    .toUriString();

            ResponseEntity<Map> response = restTemplate.postForEntity(url, null, Map.class);
            Map<String, Object> body = response.getBody();

            return body != null && Boolean.TRUE.equals(body.get("success"));

        } catch (Exception e) {
            log.error("❌ [FB-OAUTH] Error subscribing webhooks: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Generar token de estado para CSRF protection
     */
    private String generateStateToken(Long tenantId) {
        // En producción, usar un token firmado o almacenar en Redis
        // Por ahora, usamos base64(tenantId + timestamp + random)
        String payload = tenantId + ":" + System.currentTimeMillis() + ":" + UUID.randomUUID();
        return Base64.getEncoder().encodeToString(payload.getBytes());
    }

    /**
     * Validar token de estado y extraer tenantId
     */
    private Long validateStateToken(String state) {
        try {
            String decoded = new String(Base64.getDecoder().decode(state));
            String[] parts = decoded.split(":");

            if (parts.length < 3) {
                return null;
            }

            Long tenantId = Long.parseLong(parts[0]);
            long timestamp = Long.parseLong(parts[1]);

            // Validar que no haya expirado (30 minutos)
            long now = System.currentTimeMillis();
            if (now - timestamp > 30 * 60 * 1000) {
                log.warn("⚠️ [FB-OAUTH] State token expired");
                return null;
            }

            return tenantId;

        } catch (Exception e) {
            log.error("❌ [FB-OAUTH] Invalid state token: {}", e.getMessage());
            return null;
        }
    }
}
