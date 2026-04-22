package com.app.controllers;

import com.app.persistence.entity.ChannelEntity;
import com.app.persistence.services.FacebookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/channels/facebook")
@RequiredArgsConstructor
public class FacebookAuthController {

    private final FacebookService facebookService;

    @GetMapping("/config")
    public Mono<ResponseEntity<Map<String, String>>> getConfig() {
        return Mono.just(ResponseEntity.ok(Map.of("appId", facebookService.getAppId())));
    }

    @PostMapping("/exchange-token")
    public Mono<ResponseEntity<Map<String, String>>> exchangeToken(@RequestBody Map<String, String> request) {
        String shortLivedToken = request.get("shortLivedToken");
        if (shortLivedToken == null) {
            return Mono.just(ResponseEntity.badRequest().build());
        }
        
        return facebookService.exchangeForLongLivedToken(shortLivedToken)
                .map(token -> ResponseEntity.ok(Map.of("accessToken", token)))
                .onErrorResume(e -> {
                    log.error("Error exchanging token: {}", e.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    @GetMapping("/pages")
    public Mono<ResponseEntity<List<Map<String, Object>>>> getPages(@RequestHeader("X-FB-User-Token") String userToken) {
        return facebookService.getUserPages(userToken)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> {
                    log.error("Error fetching pages: {}", e.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<ChannelEntity>> registerPage(
            @RequestBody Map<String, Object> request,
            @RequestHeader("X-Tenant-Id") Long tenantId,
            @RequestHeader("X-Company-Id") Long companyId) {
            
        String pageId = (String) request.get("pageId");
        String pageName = (String) request.get("pageName");
        String pageAccessToken = (String) request.get("pageAccessToken");
        String userAccessToken = (String) request.get("userAccessToken");
        
        if (pageId == null || pageAccessToken == null) {
            return Mono.just(ResponseEntity.badRequest().build());
        }

        return facebookService.registerFacebookPage(tenantId, companyId, pageId, pageName, pageAccessToken, userAccessToken)
                .map(ResponseEntity::ok)
                .onErrorResume(e -> {
                    log.error("Error registering page: {}", e.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }
}
