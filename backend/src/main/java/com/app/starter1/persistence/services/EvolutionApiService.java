package com.app.starter1.persistence.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvolutionApiService {

    @Value("${evolution.api.url}")
    private String apiUrl;

    @Value("${evolution.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> createInstance(String instanceName, String webhookUrl) {
        String url = apiUrl + "/instance/create";
        log.info("🌐 [EVOLUTION-API] Creating instance. URL: {}", url);
        log.info("📝 [EVOLUTION-API] Instance name: {}", instanceName);
        log.info("🔑 [EVOLUTION-API] Using API Key: {}...", apiKey.substring(0, Math.min(10, apiKey.length())));

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Request body con campos requeridos
        Map<String, Object> body = new HashMap<>();
        body.put("instanceName", instanceName);
        body.put("token", apiKey); // Token de la instancia
        body.put("integration", "WHATSAPP-BAILEYS");
        body.put("qrcode", true);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        log.info("📤 [EVOLUTION-API] Sending POST request...");
        log.info("📦 [EVOLUTION-API] Body: {}", body);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            log.info("✅ [EVOLUTION-API] Success! Status: {}", response.getStatusCode());
            log.info("📦 [EVOLUTION-API] Response: {}", response.getBody());
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed: {}", e.getMessage());
            throw new RuntimeException("Failed to create Evolution API instance: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> fetchQrCode(String instanceName) {
        String url = apiUrl + "/instance/connect/" + instanceName;
        log.info("🔲 [EVOLUTION-API] Fetching QR code. URL: {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            log.info("✅ [EVOLUTION-API] QR fetched!");
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed to fetch QR: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch QR code: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> checkInstanceStatus(String instanceName) {
        String url = apiUrl + "/instance/connectionState/" + instanceName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            return response.getBody();
        } catch (Exception e) {
            return null;
        }
    }

    public Map<String, Object> logoutInstance(String instanceName) {
        String url = apiUrl + "/instance/logout/" + instanceName;
        log.info("🔌 [EVOLUTION-API] Logging out: {}", instanceName);

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.DELETE, request, Map.class);
            log.info("✅ [EVOLUTION-API] Logged out!");
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed to logout: {}", e.getMessage());
            throw new RuntimeException("Failed to logout instance: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> restartInstance(String instanceName) {
        String url = apiUrl + "/instance/restart/" + instanceName;
        log.info("🔄 [EVOLUTION-API] Restarting: {}", instanceName);

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.PUT, request, Map.class);
            log.info("✅ [EVOLUTION-API] Restarted!");
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed to restart: {}", e.getMessage());
            throw new RuntimeException("Failed to restart instance: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> deleteInstance(String instanceName) {
        String url = apiUrl + "/instance/delete/" + instanceName;
        log.info("🗑️ [EVOLUTION-API] Deleting: {}", instanceName);

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.DELETE, request, Map.class);
            log.info("✅ [EVOLUTION-API] Deleted!");
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed to delete: {}", e.getMessage());
            throw new RuntimeException("Failed to delete instance: " + e.getMessage(), e);
        }
    }

    /**
     * Enviar mensaje de texto o media a través de Evolution API
     */
    public Map<String, Object> sendMessage(String instanceName, String remoteJid, String text, String mediaUrl) {
        String url = apiUrl + "/message/sendText/" + instanceName;
        log.info("📤 [EVOLUTION-API] Sending message to: {}", remoteJid);

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("number", remoteJid);

        if (mediaUrl != null && !mediaUrl.isEmpty()) {
            // Si hay media, usar endpoint de media
            url = apiUrl + "/message/sendMedia/" + instanceName;
            body.put("mediatype", "image"); // Detectar tipo según extensión
            body.put("media", mediaUrl);
            if (text != null) {
                body.put("caption", text);
            }
        } else {
            // Mensaje de texto
            body.put("text", text);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            log.info("✅ [EVOLUTION-API] Message sent! Status: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed to send message: {}", e.getMessage());
            throw new RuntimeException("Failed to send message: " + e.getMessage(), e);
        }
    }
}
