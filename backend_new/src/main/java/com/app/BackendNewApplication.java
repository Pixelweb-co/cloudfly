package com.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceTransactionManagerAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

@org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity
@org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity
@SpringBootApplication(exclude = {
        DataSourceAutoConfiguration.class,
        DataSourceTransactionManagerAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
})
public class BackendNewApplication {

    @org.springframework.context.annotation.Bean
    public org.springframework.security.web.server.SecurityWebFilterChain securityWebFilterChain(org.springframework.security.config.web.server.ServerHttpSecurity http, com.app.config.JwtAuthenticationFilter jwtFilter) {
        System.out.println("🛡️ [STDOUT] [MAIN-APP] Initializing SecurityWebFilterChain...");
        return http
                .cors(cors -> cors.disable())
                .csrf(org.springframework.security.config.web.server.ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers("/auth/**", "/login", "/register", "/verify", "/forgot-password", "/reset-password").permitAll()
                        .anyExchange().authenticated())
                .addFilterAt(jwtFilter, org.springframework.security.config.web.server.SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.security.authentication.ReactiveAuthenticationManager authenticationManager(org.springframework.security.core.userdetails.ReactiveUserDetailsService userDetailsService,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        System.out.println("🛡️ [STDOUT] [MAIN-APP] Initializing ReactiveAuthenticationManager...");
        org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager authManager = new org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager(userDetailsService);
        authManager.setPasswordEncoder(passwordEncoder);
        return authManager;
    }

    @org.springframework.context.annotation.Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }
    public static void main(String[] args) {
        SpringApplication.run(BackendNewApplication.class, args);
    }
}
