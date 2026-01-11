package com.app.starter1.controllers;

import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.dto.CustomerConfigDTO;
import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.services.SystemConfigService;
import com.app.starter1.services.CustomerConfigService;
import com.app.starter1.utils.UserMethods;
import com.app.starter1.utils.OAuthStateManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

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
    private final CustomerConfigService customerConfigService;
    private final CustomerRepository customerRepository;
    private final ChannelRepository channelRepository;
    private final UserMethods userMethods;
    private final OAuthStateManager stateManager;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * GET /api/channels/facebook/auth-url
     * Generar URL de autorización para iniciar el flujo OAuth
     * ACTUALIZADO: Usa "Facebook Login for Business" con config_id
     */
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthorizationUrl() {
        try {
            log.info("🔑 [FB-OAUTH] Generating authorization URL (Login for Business)");

            Long tenantId = userMethods.getTenantId();

            // Obtener configuración del tenant
            CustomerConfigDTO customerConfig = customerConfigService.getCustomerConfigInternal(tenantId);

            // Verificar que Facebook esté habilitado y configurado
            if (!customerConfig.getFacebookEnabled()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook integration is not enabled for this tenant"));
            }

            if (customerConfig.getFacebookLoginConfigId() == null ||
                    customerConfig.getFacebookLoginConfigId().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "facebook_not_configured",
                                "message",
                                "Facebook Login for Business no está configurado. Configure el 'config_id' en la configuración del tenant."));
            }

            // Obtener configuración global del sistema
            SystemConfigDTO systemConfig = systemConfigService.getSystemConfig();

            // Determinar qué App ID usar (tenant o global)
            String appId = customerConfig.getFacebookAppId() != null
                    ? customerConfig.getFacebookAppId()
                    : systemConfig.getFacebookAppId();

            if (appId == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook App ID not configured"));
            }

            // Validar frontendUrl
            String frontendUrl = systemConfig.getFrontendUrl();
            if (frontendUrl == null || frontendUrl.isEmpty()) {
                frontendUrl = "http://localhost:3000";
            }

            String redirectUri = frontendUrl + "/comunicaciones/canales";
            String state = generateStateToken(tenantId);

            // Usar Facebook Login for Business con config_id
            String authUrl = UriComponentsBuilder
                    .fromHttpUrl("https://www.facebook.com/" + systemConfig.getFacebookApiVersion() + "/dialog/oauth")
                    .queryParam("client_id", appId)
                    .queryParam("redirect_uri", redirectUri)
                    .queryParam("state", state)
                    .queryParam("config_id", customerConfig.getFacebookLoginConfigId()) // ⬅️ CAMBIO CLAVE
                    .queryParam("response_type", "code")
                    .build()
                    .toUriString();

            log.info("✅ [FB-OAUTH] Authorization URL generated with config_id: {}",
                    customerConfig.getFacebookLoginConfigId());

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

            // Obtener configuración del tenant y del sistema
            CustomerConfigDTO customerConfig = customerConfigService.getCustomerConfigInternal(tenantId);
            SystemConfigDTO systemConfig = systemConfigService.getSystemConfigInternal();

            // Determinar qué credenciales usar (tenant o global)
            String appId = customerConfig.getFacebookAppId() != null
                    ? customerConfig.getFacebookAppId()
                    : systemConfig.getFacebookAppId();

            String appSecret = customerConfig.getFacebookAppSecret() != null
                    ? customerConfig.getFacebookAppSecret()
                    : systemConfig.getFacebookAppSecret();

            if (appId == null || appSecret == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook App credentials not configured"));
            }

            String frontendUrl = systemConfig.getFrontendUrl();
            if (frontendUrl == null || frontendUrl.isEmpty()) {
                frontendUrl = "http://localhost:3000";
            }

            String redirectUri = frontendUrl + "/comunicaciones/canales";

            // 1. Intercambiar código por access token
            String shortLivedToken = exchangeCodeForToken(code, appId, appSecret, redirectUri);

            // 2. Token de larga duración
            String longLivedToken = exchangeForLongLivedToken(shortLivedToken, appId, appSecret);

            // 3. Obtener páginas
            List<Map<String, Object>> pages = getUserPages(longLivedToken);

            if (pages.isEmpty()) {
                log.warn(
                        "⚠️ [FB-OAUTH] No pages found for this user. Permissions might be missing or user has no pages.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error", "no_pages_found",
                                "message",
                                "No se encontraron páginas de Facebook. Asegúrate de haber otorgado permisos a la aplicación para administrar tus páginas."));
            }

            // 4. Conectar primera página (TODO: selector)
            Map<String, Object> selectedPage = pages.get(0);
            String pageId = (String) selectedPage.get("id");
            String pageName = (String) selectedPage.get("name");
            String pageAccessToken = (String) selectedPage.get("access_token");

            log.info("📄 [FB-OAUTH] Selecting first page: {} ({})", pageName, pageId);

            // 5. Suscribir webhooks
            boolean subscribed = subscribePageToWebhooks(pageId, pageAccessToken);
            if (!subscribed) {
                log.warn("⚠️ [FB-OAUTH] Failed to subscribe webhooks for page: {}", pageName);
            }

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
            channel.setLastSync(java.time.LocalDateTime.now());
            channel.setLastError(null);

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

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("access_token")) {
                return root.get("access_token").asText();
            } else {
                log.error("❌ [FB-OAUTH] Failed to get access token. Response: {}", response.getBody());
                throw new RuntimeException("No access token in response");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to exchange code for token", e);
        }
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

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            if (root.has("access_token")) {
                return root.get("access_token").asText();
            } else {
                return shortLivedToken; // Fallback to short lived if fails
            }
        } catch (Exception e) {
            log.warn("⚠️ [FB-OAUTH] Failed to get long-lived token, using short-lived one: {}", e.getMessage());
            return shortLivedToken;
        }
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

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            String body = response.getBody();

            log.info("📊 [FB-OAUTH] Pages API Response: {}", body);

            JsonNode root = objectMapper.readTree(body);
            JsonNode data = root.path("data");

            if (data.isMissingNode() || !data.isArray()) {
                return Collections.emptyList();
            }

            List<Map<String, Object>> pages = new ArrayList<>();
            for (JsonNode node : data) {
                Map<String, Object> page = new HashMap<>();
                page.put("id", node.path("id").asText());
                page.put("name", node.path("name").asText());
                page.put("access_token", node.path("access_token").asText());
                pages.add(page);
            }

            return pages;
        } catch (Exception e) {
            log.error("❌ [FB-OAUTH] Error fetching user pages", e);
            return Collections.emptyList();
        }
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

            ResponseEntity<String> response = restTemplate.postForEntity(url, null, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());

            boolean success = root.path("success").asBoolean(false);
            log.info("📡 [FB-OAUTH] Webhook subscription for page {}: {}", pageId, success ? "SUCCESS" : "FAILED");

            return success;

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
