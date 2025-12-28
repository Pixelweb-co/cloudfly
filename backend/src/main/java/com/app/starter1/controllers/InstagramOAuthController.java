package com.app.starter1.controllers;

import com.app.starter1.dto.SystemConfigDTO;
import com.app.starter1.persistence.entity.Channel;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ChannelRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.services.SystemConfigService;
import com.app.starter1.utils.UserMethods;
import com.app.starter1.utils.OAuthStateManager;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/api/channels/instagram")
@RequiredArgsConstructor
public class InstagramOAuthController {

    private final SystemConfigService systemConfigService;
    private final ChannelRepository channelRepository;
    private final CustomerRepository customerRepository;
    private final UserMethods userMethods;
    private final OAuthStateManager stateManager;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * GET /api/channels/instagram/auth-url
     * Generar URL de autorización para Instagram
     */
    @GetMapping("/auth-url")
    public ResponseEntity<?> getAuthorizationUrl() {
        try {
            log.info("🔑 [IG-OAUTH] Generating Instagram authorization URL");

            SystemConfigDTO config = systemConfigService.getSystemConfig();

            if (config.getFacebookEnabled() == null || !config.getFacebookEnabled()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook/Instagram integration not enabled"));
            }

            if (config.getFacebookAppId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Facebook App ID not configured"));
            }

            String frontendUrl = config.getFrontendUrl();
            if (frontendUrl == null || frontendUrl.isEmpty()) {
                frontendUrl = "http://localhost:3000";
            }

            String redirectUri = frontendUrl + "/comunicaciones/canales";

            Long tenantId = userMethods.getTenantId();
            String state = generateStateToken(tenantId);

            // Instagram usa los mismos scopes que Facebook Messenger
            String scopes = String.join(",", List.of(
                    "instagram_basic",
                    "instagram_manage_messages",
                    "pages_show_list",
                    "pages_manage_metadata"));

            String authUrl = UriComponentsBuilder
                    .fromHttpUrl("https://www.facebook.com/" + config.getFacebookApiVersion() + "/dialog/oauth")
                    .queryParam("client_id", config.getFacebookAppId())
                    .queryParam("redirect_uri", redirectUri)
                    .queryParam("state", state)
                    .queryParam("scope", scopes)
                    .queryParam("response_type", "code")
                    .build()
                    .toUriString();

            log.info("✅ [IG-OAUTH] Authorization URL generated for Instagram");

            return ResponseEntity.ok(Map.of(
                    "authUrl", authUrl,
                    "state", state));

        } catch (Exception e) {
            log.error("❌ [IG-OAUTH] Error generating auth URL: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to generate authorization URL"));
        }
    }

    /**
     * POST /api/channels/instagram/connect
     * Conectar cuenta de Instagram
     */
    @PostMapping("/connect")
    public ResponseEntity<?> connectInstagramChannel(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        String state = request.get("state");
        String error = request.get("error");

        log.info("📥 [IG-OAUTH] Received connect request with code: {}", code != null ? "present" : "missing");
        log.debug("🔍 [IG-OAUTH] State token received: {}", state);

        if (error != null) {
            log.error("❌ [IG-OAUTH] Authorization error: {}", error);
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }

        try {
            Long tenantId = validateStateToken(state);
            if (tenantId == null) {
                log.error("❌ [IG-OAUTH] Invalid state token - returning error");
                return ResponseEntity.badRequest().body(Map.of("error", "invalid_state"));
            }

            log.info("✅ [IG-OAUTH] State validated successfully for tenant: {}", tenantId);

            SystemConfigDTO config = systemConfigService.getSystemConfigInternal();

            String frontendUrl = config.getFrontendUrl();
            if (frontendUrl == null || frontendUrl.isEmpty()) {
                frontendUrl = "http://localhost:3000";
            }

            String redirectUri = frontendUrl + "/comunicaciones/canales";

            log.info("🔄 [IG-OAUTH] Starting token exchange with redirect URI: {}", redirectUri);

            // 1. Intercambiar código por access token
            String shortLivedToken = exchangeCodeForToken(
                    code,
                    config.getFacebookAppId(),
                    config.getFacebookAppSecret(),
                    redirectUri);

            log.info("✅ [IG-OAUTH] Short-lived token obtained");

            // 2. Token de larga duración
            String longLivedToken = exchangeForLongLivedToken(
                    shortLivedToken,
                    config.getFacebookAppId(),
                    config.getFacebookAppSecret());

            log.info("✅ [IG-OAUTH] Long-lived token obtained");

            // 3. Obtener páginas de Facebook vinculadas
            List<Map<String, Object>> pages = getUserPages(longLivedToken);

            log.info("📄 [IG-OAUTH] Found {} Facebook pages", pages.size());

            if (pages.isEmpty()) {
                log.warn("⚠️ [IG-OAUTH] No Facebook pages found for user");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "no_pages_found"));
            }

            // 4. Para cada página, verificar si tiene Instagram conectado
            for (Map<String, Object> page : pages) {
                String pageId = (String) page.get("id");
                String pageName = (String) page.get("name");
                String pageAccessToken = (String) page.get("access_token");

                log.info("🔍 [IG-OAUTH] Checking page: {} ({})", pageName, pageId);

                // Obtener cuenta de Instagram conectada a la página
                Map<String, Object> igAccountData = getInstagramAccount(pageId, pageAccessToken);

                if (igAccountData != null) {
                    String igAccountId = (String) igAccountData.get("id");
                    String igUsername = (String) igAccountData.get("username");

                    log.info("📸 [IG-OAUTH] Instagram account found: @{} ({})", igUsername, igAccountId);

                    // Guardar canal de Instagram
                    Customer customer = customerRepository.findById(tenantId)
                            .orElseThrow(() -> new RuntimeException("Customer not found"));

                    Optional<Channel> existingChannel = channelRepository
                            .findByCustomerAndTypeAndPageId(customer, Channel.ChannelType.INSTAGRAM, igAccountId);

                    Channel channel = existingChannel.orElseGet(() -> {
                        Channel c = new Channel();
                        c.setCustomer(customer);
                        c.setType(Channel.ChannelType.INSTAGRAM);
                        return c;
                    });

                    channel.setName("Instagram - @" + igUsername);
                    channel.setPageId(igAccountId);
                    channel.setUsername(igUsername);
                    channel.setAccessToken(pageAccessToken);
                    channel.setIsActive(true);
                    channel.setIsConnected(true);

                    channelRepository.save(channel);

                    log.info("✅ [IG-OAUTH] Instagram channel connected: @{}", igUsername);

                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "channelName", "@" + igUsername));
                } else {
                    log.debug("ℹ️ [IG-OAUTH] No Instagram account linked to page: {}", pageName);
                }
            }

            log.warn("⚠️ [IG-OAUTH] No Instagram Business account found in any Facebook page");

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "no_instagram_account_found",
                            "message", "No Instagram Business account connected to your Facebook pages"));

        } catch (Exception e) {
            log.error("❌ [IG-OAUTH] Error connecting Instagram: {} - {}", e.getClass().getSimpleName(), e.getMessage(),
                    e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "connection_failed", "details", e.getMessage()));
        }
    }

    private String generateStateToken(Long tenantId) {
        String state = stateManager.generateStateToken(tenantId, "instagram");
        log.debug("🔑 [IG-OAUTH] Generated state token for tenant: {}", tenantId);
        return state;
    }

    private Long validateStateToken(String state) {
        log.debug("🔍 [IG-OAUTH] Validating state token: {}", state);

        OAuthStateManager.StateData data = stateManager.validateAndRemove(state);

        if (data == null) {
            log.warn("⚠️ [IG-OAUTH] Invalid or expired state token");
            return null;
        }

        log.debug("✅ [IG-OAUTH] State token valid for tenant: {} (platform: {})",
                data.getTenantId(), data.getPlatform());
        return data.getTenantId();
    }

    private String exchangeCodeForToken(String code, String appId, String appSecret, String redirectUri) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://graph.facebook.com/v18.0/oauth/access_token")
                .queryParam("client_id", appId)
                .queryParam("client_secret", appSecret)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("code", code)
                .build()
                .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        try {
            JsonNode node = objectMapper.readTree(response.getBody());
            return node.path("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse token response", e);
        }
    }

    private String exchangeForLongLivedToken(String shortToken, String appId, String appSecret) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://graph.facebook.com/v18.0/oauth/access_token")
                .queryParam("grant_type", "fb_exchange_token")
                .queryParam("client_id", appId)
                .queryParam("client_secret", appSecret)
                .queryParam("fb_exchange_token", shortToken)
                .build()
                .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        try {
            JsonNode node = objectMapper.readTree(response.getBody());
            return node.path("access_token").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to exchange for long-lived token", e);
        }
    }

    private List<Map<String, Object>> getUserPages(String accessToken) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://graph.facebook.com/v18.0/me/accounts")
                .queryParam("access_token", accessToken)
                .build()
                .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        try {
            JsonNode node = objectMapper.readTree(response.getBody());
            JsonNode data = node.path("data");

            List<Map<String, Object>> pages = new ArrayList<>();
            for (JsonNode page : data) {
                Map<String, Object> pageMap = new HashMap<>();
                pageMap.put("id", page.path("id").asText());
                pageMap.put("name", page.path("name").asText());
                pageMap.put("access_token", page.path("access_token").asText());
                pages.add(pageMap);
            }

            return pages;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get user pages", e);
        }
    }

    /**
     * Obtener la cuenta de Instagram conectada a una página de Facebook
     */
    private Map<String, Object> getInstagramAccount(String pageId, String pageAccessToken) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl("https://graph.facebook.com/v18.0/" + pageId)
                    .queryParam("fields", "instagram_business_account")
                    .queryParam("access_token", pageAccessToken)
                    .build()
                    .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode node = objectMapper.readTree(response.getBody());

            if (node.has("instagram_business_account")) {
                String igAccountId = node.path("instagram_business_account").path("id").asText();

                // Obtener username de la cuenta de Instagram
                String igUrl = UriComponentsBuilder
                        .fromHttpUrl("https://graph.facebook.com/v18.0/" + igAccountId)
                        .queryParam("fields", "username")
                        .queryParam("access_token", pageAccessToken)
                        .build()
                        .toUriString();

                ResponseEntity<String> igResponse = restTemplate.getForEntity(igUrl, String.class);
                JsonNode igNode = objectMapper.readTree(igResponse.getBody());

                Map<String, Object> result = new HashMap<>();
                result.put("id", igAccountId);
                result.put("username", igNode.path("username").asText());
                return result;
            }

            return null;
        } catch (Exception e) {
            log.debug("No Instagram account for page {}: {}", pageId, e.getMessage());
            return null;
        }
    }
}
