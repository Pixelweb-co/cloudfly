package com.app;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class AppConfig {

    @Bean
    public com.app.config.JwtAuthenticationFilter jwtAuthenticationFilter(com.app.util.JwtProvider jwtProvider) {
        return new com.app.config.JwtAuthenticationFilter(jwtProvider);
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http, com.app.config.JwtAuthenticationFilter jwtAuthenticationFilter) {
        System.out.println("🛡️ [CORE-LOG] INITIALIZING SecurityWebFilterChain IN AppConfig...");
        return http
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .matchers(exchange -> {
                            String secret = exchange.getRequest().getHeaders().getFirst("X-AI-Secret");
                            String auth = exchange.getRequest().getHeaders().getFirst(org.springframework.http.HttpHeaders.AUTHORIZATION);
                            String expected = "cloudfly_ai_secret_2026";
                            boolean matches = expected.equals(secret) || (auth != null && auth.equals("AI-Secret " + expected));
                            if (matches) {
                                System.out.println("🛡️ [MATCHER-OK] Secret match for path: " + exchange.getRequest().getPath());
                                return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.match();
                            }
                            return org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher.MatchResult.notMatch();
                        }).permitAll()
                        .pathMatchers("/media/**", "/auth/**", "/login", "/register", "/verify", "/forgot-password", "/reset-password", "/api/webhooks/evolution", "/api/chatbotEnable").permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.OPTIONS).permitAll() // Allow preflight
                        .anyExchange().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, org.springframework.security.config.web.server.SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    @Bean
    public ReactiveAuthenticationManager authenticationManager(ReactiveUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        System.out.println("🛡️ [CORE-LOG] INITIALIZING ReactiveAuthenticationManager IN AppConfig...");
        org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager authManager = new org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager(userDetailsService);
        authManager.setPasswordEncoder(passwordEncoder);
        return authManager;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        System.out.println("🛡️ [CORE-LOG] INITIALIZING PasswordEncoder IN AppConfig...");
        return new BCryptPasswordEncoder();
    }
}
