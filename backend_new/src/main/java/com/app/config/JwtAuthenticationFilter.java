package com.app.config;

import com.app.util.JwtProvider;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.app.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class JwtAuthenticationFilter implements WebFilter {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        log.info("🛡️ [JWT-FILTER] Initializing JwtAuthenticationFilter...");
        this.jwtProvider = jwtProvider;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        log.info("🚀 [JWT-FILTER] Hitting path: {}", path);
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // Skips auth paths
        if (path.startsWith("/auth/") || path.equals("/login") || path.equals("/register")) {
            return chain.filter(exchange);
        }

        exchange.getRequest().getHeaders().forEach((name, values) -> {
            log.info("🔍 [HEADER] {}: {}", name, values);
        });

        // --- AI Internal Auth Bypass ---
        String aiSecret = exchange.getRequest().getHeaders().getFirst("X-AI-Secret");
        String authHeaderValue = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        String querySecret = exchange.getRequest().getQueryParams().getFirst("ai_secret");
        
        String expectedSecret = "cloudfly_ai_secret_2026";
        boolean isValid = (aiSecret != null && aiSecret.equals(expectedSecret)) || 
                         (authHeaderValue != null && authHeaderValue.contains(expectedSecret)) ||
                         (querySecret != null && querySecret.equals(expectedSecret));

        if (isValid) {
            log.info("🤖 [JWT-FILTER] Internal AI secret valid (via {}). Path: {}", 
                aiSecret != null ? "X-AI-Secret" : (querySecret != null ? "QueryParam" : "Authorization"), path);
            
            List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
            
            String tenantIdStr = exchange.getRequest().getQueryParams().getFirst("tenantId");
            Long tenantId = 1L;
            if (tenantIdStr != null) {
                try {
                    tenantId = Long.parseLong(tenantIdStr);
                } catch (Exception e) {
                    log.warn("⚠️ [JWT-FILTER] Invalid tenantId in query: {}", tenantIdStr);
                }
            }

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("ai-agent", null, authorities);
            java.util.Map<String, Object> details = new java.util.HashMap<>();
            details.put("customer_id", tenantId);
            details.put("company_id", null);
            auth.setDetails(details);

            return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
        }
        // -------------------------------

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("🛡️ [JWT-FILTER] No 'Bearer' token found for path: {}", path);
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);

        try {
            DecodedJWT decodedJWT = jwtProvider.validateToken(token);
            String username = jwtProvider.extractUsername(decodedJWT);
            
            com.auth0.jwt.interfaces.Claim authoritiesClaim = decodedJWT.getClaim("authorities");
            String authoritiesStr = !authoritiesClaim.isMissing() ? authoritiesClaim.asString() : "";

            List<SimpleGrantedAuthority> authorities = Arrays.stream(authoritiesStr.split(","))
                    .filter(s -> !s.isEmpty())
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            Long customerId = decodedJWT.getClaim("customer_id").asLong();
            Long companyId = decodedJWT.getClaim("company_id").asLong();

            log.info("🛡️ [JWT-FILTER] Valid token for user: {}. Roles: {}. Path: {}. CustomerID: {}", 
                     username, authoritiesStr, path, customerId);

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(username, null,
                    authorities);
            
            // Adjuntar los IDs en los detalles para uso posterior
            java.util.Map<String, Object> details = new java.util.HashMap<>();
            details.put("customer_id", customerId);
            details.put("company_id", companyId);
            auth.setDetails(details);

            return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));

        } catch (Exception e) {
            log.error("🛡️ [JWT-FILTER] Token validation failed for path {}: {}", path, e.getMessage());
            // Token inválido, simplemente continuamos sin autenticación
            return chain.filter(exchange);
        }
    }
}
