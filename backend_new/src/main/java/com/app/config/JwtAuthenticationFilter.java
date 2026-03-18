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

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements WebFilter {

    private final JwtProvider jwtProvider;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
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
            // Token inválido, simplemente continuamos sin autenticación
            return chain.filter(exchange);
        }
    }
}
