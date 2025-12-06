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
        log.info("📝 [EVOLUTION-API] Instance name: {}, Webhook: {}", instanceName, webhookUrl);
        log.info("🔑 [EVOLUTION-API] Using API Key: {}...", apiKey.substring(0, Math.min(10, apiKey.length())));

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("instanceName", instanceName);
        body.put("qrcode", true);
        body.put("webhook", webhookUrl);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        log.info("📤 [EVOLUTION-API] Sending POST request to Evolution API...");

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            log.info("✅ [EVOLUTION-API] Success! Status: {}", response.getStatusCode());
            log.info("📦 [EVOLUTION-API] Response body keys: {}",
                    response.getBody() != null ? response.getBody().keySet() : "null");
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed to create instance: {}", e.getMessage());
            log.error("🔍 [EVOLUTION-API] Error details: ", e);
            throw new RuntimeException("Failed to create Evolution API instance: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> fetchQrCode(String instanceName) {
        String url = apiUrl + "/instance/connect/" + instanceName;
        log.info("🔲 [EVOLUTION-API] Fetching QR code. URL: {}", url);

        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", apiKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        log.info("📤 [EVOLUTION-API] Sending GET request for QR code...");

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            log.info("✅ [EVOLUTION-API] QR fetched! Status: {}", response.getStatusCode());
            return response.getBody();
        } catch (Exception e) {
            log.error("❌ [EVOLUTION-API] Failed to fetch QR code: {}", e.getMessage());
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
            // If instance doesn't exist or error, return null or handle gracefully
            return null;
        }
    }
}
