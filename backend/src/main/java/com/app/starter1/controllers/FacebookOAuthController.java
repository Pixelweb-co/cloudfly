package com.app.starter1.controllers;

import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.services.SystemConfigService;
import com.app.starter1.utils.UserMethods;
import com.app.starter1.utils.OAuthStateManager;
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
    private final OAuthStateManager stateManager;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * GET /api/channels/facebook/auth-url
     * Generar URL de autorización para iniciar el flujo OAuth
     */
    /**
     * GET /api/channels/facebook/auth-url
     * Generar URL de autorización para iniciar el flujo OAuth
     */
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthorizationUrl() {
        try {
            log.info("🔑 [FB-OAUTH] Generating authorization URL");

            SystemConfigDTO config = systemConfigService.getSystemConfig();

            // Validar integración
            if (config.getFacebookEnabled() == null || !config.getFacebookEnabled()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook integration is not enabled"));
            }

            if (config.getFacebookAppId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook App ID not configured"));
            }

            // Validar frontendUrl
            String frontendUrl = config.getFrontendUrl();
            if (frontendUrl == null || frontendUrl.isEmpty()) {
                // Fallback por defecto si no está configurado (pero debería estarlo)
                frontendUrl = "http://localhost:3000";
            }

            // La redirect_uri debe ser la URL del frontend donde Facebook retornará el
            // código
            // Debe coincidir EXACTAMENTE con lo configurado en Facebook Developers
            String redirectUri = frontendUrl + "/comunicaciones/canales";

            Long tenantId = userMethods.getTenantId();
            String state = generateStateToken(tenantId);

            String scopes = String.join(",", List.of(
                    "pages_show_list",
                    "pages_messaging",
                    "pages_manage_metadata",
                    "pages_read_engagement",
                    "email"));

            String authUrl = UriComponentsBuilder
                    .fromHttpUrl("https://www.facebook.com/" + config.getFacebookApiVersion() + "/dialog/oauth")
                    .queryParam("client_id", config.getFacebookAppId())
                    .queryParam("redirect_uri", redirectUri)
                    .queryParam("state", state)
                    .queryParam("scope", scopes)
                    .queryParam("auth_type", "rerequest")
                    .queryParam("response_type", "code")
                    .build()
                    .toUriString();

            log.info("✅ [FB-OAUTH] Authorization URL generated. Redirect URI: {}", redirectUri);

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
     * POST /api/channels/facebook/connect
     * Conectar canal usando el código recibido en el frontend
     */
    @PostMapping("/connect")
    public ResponseEntity<?> connectFacebookChannel(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String state = request.get("state");
        String error = request.get("error");

        log.info("📥 [FB-OAUTH] Received connect request with code: {}", code != null ? "present" : "missing");

        if (error != null) {
            log.error("❌ [FB-OAUTH] Authorization error from frontend: {}", error);
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }

        try {
            Long tenantId = validateStateToken(state);
            if (tenantId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "invalid_state"));
            }

            // Usar configuración interna para obtener secretos
            SystemConfigDTO config = systemConfigService.getSystemConfigInternal();

            String frontendUrl = config.getFrontendUrl();
            if (frontendUrl == null || frontendUrl.isEmpty()) {
                frontendUrl = "http://localhost:3000";
            }

            // La redirect_uri DEBE ser la misma que se usó para generar el authUrl
            String redirectUri = frontendUrl + "/comunicaciones/canales";

            // 1. Intercambiar código por access token
            String shortLivedToken = exchangeCodeForToken(
                    code,
                    config.getFacebookAppId(),
                    config.getFacebookAppSecret(),
                    redirectUri);

            // 2. Token de larga duración
            String longLivedToken = exchangeForLongLivedToken(
                    shortLivedToken,
                    config.getFacebookAppId(),
                    config.getFacebookAppSecret());

            // 3. Obtener páginas
            List<Map<String, Object>> pages = getUserPages(longLivedToken);

            if (pages.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "no_pages_found"));
            }

            // 4. Conectar primera página (TODO: selector)
            Map<String, Object> selectedPage = pages.get(0);
            String pageId = (String) selectedPage.get("id");
            String pageName = (String) selectedPage.get("name");
            String pageAccessToken = (String) selectedPage.get("access_token");

            // 5. Suscribir webhooks
            subscribePageToWebhooks(pageId, pageAccessToken);

            // 6. Guardar canal
            Customer customer = customerRepository.findById(tenantId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            Optional<Channel> existingChannel = channelRepository
                    .findByCustomerAndTypeAndPageId(customer, Channel.ChannelType.FACEBOOK, pageId);

            Channel channel = existingChannel.orElseGet(() -> {
                Channel c = new Channel();
                c.setCustomer(customer);
                c.setType(Channel.ChannelType.FACEBOOK);
                return c;
            });

            channel.setName("Facebook - " + pageName);
            channel.setPageId(pageId);
            channel.setAccessToken(pageAccessToken);
            channel.setIsActive(true);
            channel.setIsConnected(true);

            channelRepository.save(channel);

            log.info("✅ [FB-OAUTH] Channel connected successfully: {}", pageName);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "channelName", pageName));

        } catch (Exception e) {
            log.error("❌ [FB-OAUTH] Error connecting channel: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "connection_failed", "details", e.getMessage()));
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
        String state = stateManager.generateStateToken(tenantId, "facebook");
        log.debug("🔑 [FB-OAUTH] Generated state token for tenant: {}", tenantId);
        return state;
    }

    /**
     * Validar token de estado y extraer tenantId
     */
    private Long validateStateToken(String state) {
        log.debug("🔍 [FB-OAUTH] Validating state token: {}", state);

        OAuthStateManager.StateData data = stateManager.validateAndRemove(state);

        if (data == null) {
            log.warn("⚠️ [FB-OAUTH] Invalid or expired state token");
            return null;
        }

        log.debug("✅ [FB-OAUTH] State token valid for tenant: {} (platform: {})",
                data.getTenantId(), data.getPlatform());
        return data.getTenantId();
    }
}
