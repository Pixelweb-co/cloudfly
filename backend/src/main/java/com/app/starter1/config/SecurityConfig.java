package com.app.starter1.config;

import org.springframework.beans.factory.annotation.Value;
import com.app.starter1.config.filter.JwtTokenValidator;
import com.app.starter1.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

        @Autowired
        JwtUtils jwtUtils;
        @Autowired
        private final AuthenticationConfiguration authenticationConfiguration;

        @Value("${cors.allowed.origin}")
        private String allowedOrigin;

        @Autowired
        private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

        public SecurityConfig(AuthenticationConfiguration authenticationConfiguration,
                        CustomAuthenticationEntryPoint customAuthenticationEntryPoint) {
                this.authenticationConfiguration = authenticationConfiguration;
                this.customAuthenticationEntryPoint = customAuthenticationEntryPoint;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) throws Exception {
                return httpSecurity
                                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Habilitar CORS
                                .csrf(csrf -> csrf.disable())
                                .httpBasic(Customizer.withDefaults())
                                .exceptionHandling(exception -> exception
                                                .authenticationEntryPoint(customAuthenticationEntryPoint)) // Aquí
                                                                                                           // se
                                                                                                           // usa
                                                                                                           // el
                                                                                                           // EntryPoint
                                                                                                           // personalizado
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(http -> {
                                        // Configurar los endpoints públicos
                                        http.requestMatchers(HttpMethod.POST, "/auth/**").permitAll();
                                        http.requestMatchers(HttpMethod.GET, "/auth/**").permitAll();

                                        http.requestMatchers(HttpMethod.GET, "/sendnotification/**").permitAll();
                                        http.requestMatchers(HttpMethod.GET, "/api/public/chatbot/**").permitAll();

                                        // Swagger UI y OpenAPI
                                        http.requestMatchers("/v3/api-docs/**").permitAll();
                                        http.requestMatchers("/swagger-ui/**").permitAll();
                                        http.requestMatchers("/swagger-ui.html").permitAll();

                                        // Chatbot configuración (todos los roles autenticados)
                                        http.requestMatchers(HttpMethod.GET, "/api/chatbot/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.POST, "/api/chatbot/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/api/chatbot/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.DELETE, "/api/chatbot/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL", "USER");

                                        // Configurar los endpoints privados
                                        // auth
                                        http.requestMatchers(HttpMethod.GET, "/users/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.GET, "/roles/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.POST, "/users/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/users/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN");

                                        http.requestMatchers(HttpMethod.GET, "/customers/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.POST, "/customers/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.PUT, "/customers/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/customers/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN",
                                                        "BIOMEDICAL");

                                        // products
                                        http.requestMatchers(HttpMethod.GET, "/productos/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/productos/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.POST, "/productos/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/productos/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN",
                                                        "BIOMEDICAL");

                                        // type device
                                        http.requestMatchers(HttpMethod.GET, "/type-device/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/type-device/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.POST, "/type-device/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/type-device/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN");

                                        // solicitudes
                                        http.requestMatchers(HttpMethod.GET, "/solicitudes/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/solicitudes/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.POST, "/solicitudes/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/solicitudes/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN",
                                                        "BIOMEDICAL");
                                        // contacts (clientes POS)
                                        http.requestMatchers(HttpMethod.GET, "/contacts/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/contacts/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.POST, "/contacts/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.DELETE, "/contacts/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");

                                        // quotes (cotizaciones)
                                        http.requestMatchers(HttpMethod.GET, "/quotes/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.POST, "/quotes/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/quotes/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.DELETE, "/quotes/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");

                                        // invoices (facturas)
                                        http.requestMatchers(HttpMethod.GET, "/invoices/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.POST, "/invoices/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/invoices/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.DELETE, "/invoices/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");

                                        // orders (ventas POS)
                                        http.requestMatchers(HttpMethod.GET, "/orders/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.POST, "/orders/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.PATCH, "/orders/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.DELETE, "/orders/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");

                                        // chart of accounts (contabilidad)
                                        http.requestMatchers(HttpMethod.GET, "/chart-of-accounts/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.POST, "/chart-of-accounts/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.PUT, "/chart-of-accounts/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/chart-of-accounts/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");

                                        // accounting reports (contabilidad)
                                        http.requestMatchers(HttpMethod.GET, "/api/accounting/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL", "USER");
                                        // cost centers (centros de costo)
                                        http.requestMatchers(HttpMethod.GET, "/cost-centers/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.POST, "/cost-centers/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.PUT, "/cost-centers/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/cost-centers/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        // accounting vouchers (comprobantes)
                                        http.requestMatchers(HttpMethod.GET, "/accounting/vouchers/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN", "CONTADOR");
                                        http.requestMatchers(HttpMethod.POST, "/accounting/vouchers/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN");
                                        http.requestMatchers(HttpMethod.PUT, "/accounting/vouchers/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/accounting/vouchers/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN");

                                        // tipo servicio
                                        http.requestMatchers(HttpMethod.GET, "/type-service/**").hasAnyRole(
                                                        "SUPERADMIN", "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/type-service/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN");
                                        http.requestMatchers(HttpMethod.POST, "/type-service/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/type-service/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN");

                                        // plantillas
                                        http.requestMatchers(HttpMethod.GET, "/plantillas/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/plantillas/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.POST, "/plantillas/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/plantillas/**")
                                                        .hasAnyRole("SUPERADMIN", "BIOMEDICAL");

                                        // reportes
                                        http.requestMatchers(HttpMethod.GET, "/reportes/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/reportes/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.POST, "/reportes/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/reportes/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");

                                        // checkeo
                                        http.requestMatchers(HttpMethod.GET, "/checkeo/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/checkeo/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.POST, "/checkeo/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/checkeo/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");

                                        // schedule calendar
                                        http.requestMatchers(HttpMethod.GET, "/schedule/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/schedule/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.POST, "/schedule/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/schedule/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL");

                                        // categorias
                                        http.requestMatchers(HttpMethod.GET, "/categorias/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/categorias/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.POST, "/categorias/**").hasAnyRole("SUPERADMIN",
                                                        "BIOMEDICAL",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/categorias/**").hasAnyRole(
                                                        "SUPERADMIN", "BIOMEDICAL",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.PATCH, "/categorias/**").hasAnyRole(
                                                        "SUPERADMIN", "BIOMEDICAL",
                                                        "ADMIN");

                                        // chatbot types
                                        http.requestMatchers(HttpMethod.GET, "/chatbot-types/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.PUT, "/chatbot-types/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.POST, "/chatbot-types/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.DELETE, "/chatbot-types/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");
                                        http.requestMatchers(HttpMethod.PATCH, "/chatbot-types/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN");

                                        // chat / conversaciones
                                        http.requestMatchers(HttpMethod.GET, "/api/chat/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.POST, "/api/chat/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN",
                                                        "USER");
                                        http.requestMatchers(HttpMethod.PATCH, "/api/chat/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN",
                                                        "USER");

                                        // plantilla verficacion

                                        http.requestMatchers(HttpMethod.GET, "/plantillas-verificacion/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "ADMIN", "BIOMEDICAL", "USER");
                                        http.requestMatchers(HttpMethod.PUT, "/plantillas-verificacion/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.POST, "/plantillas-verificacion/**").hasAnyRole(
                                                        "SUPERADMIN",
                                                        "BIOMEDICAL");
                                        http.requestMatchers(HttpMethod.DELETE, "/plantillas-verificacion/**")
                                                        .hasAnyRole("SUPERADMIN",
                                                                        "BIOMEDICAL");

                                        // dashboard overview (lectura)
                                        http.requestMatchers(HttpMethod.GET, "/dashboard/**").hasAnyRole("SUPERADMIN",
                                                        "ADMIN",
                                                        "BIOMEDICAL", "USER");

                                        // libreria de medios
                                        http.requestMatchers(HttpMethod.POST, "/media/**").permitAll();
                                        http.requestMatchers(HttpMethod.GET, "/media/**").permitAll();
                                        http.requestMatchers(HttpMethod.DELETE, "/media/**").permitAll();
                                        http.requestMatchers(HttpMethod.GET, "/document/**").permitAll();
                                        http.requestMatchers(HttpMethod.POST, "/document/**").permitAll();
                                        http.requestMatchers(HttpMethod.DELETE, "/document/**").permitAll();
                                        http.requestMatchers(HttpMethod.GET, "/firma-user/**").permitAll();
                                        http.requestMatchers(HttpMethod.POST, "/firma-user/**").permitAll();
                                        http.requestMatchers(HttpMethod.DELETE, "/firma-user/**").permitAll();
                                        http.requestMatchers(HttpMethod.GET, "/firma-solicitud/**").permitAll();
                                        http.requestMatchers(HttpMethod.POST, "/firma-solicitud/**").permitAll();
                                        http.requestMatchers(HttpMethod.DELETE, "/firma-solicitud/**").permitAll();

                                        // 👉 contabilidad
                                        http.requestMatchers(HttpMethod.GET, "/api/accounting/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "CONTADOR");
                                        http.requestMatchers(HttpMethod.POST, "/api/accounting/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "CONTADOR");

                                        // 👉 nuevo: imágenes /uploads/**
                                        http.requestMatchers(HttpMethod.GET, "/uploads/**").permitAll();

                                        // 👉 Recursos Humanos (HR & Payroll)
                                        http.requestMatchers(HttpMethod.GET, "/api/hr/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "HR");
                                        http.requestMatchers(HttpMethod.POST, "/api/hr/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "HR");
                                        http.requestMatchers(HttpMethod.PUT, "/api/hr/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "HR");
                                        http.requestMatchers(HttpMethod.PATCH, "/api/hr/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "HR");
                                        http.requestMatchers(HttpMethod.DELETE, "/api/hr/**")
                                                        .hasAnyRole("SUPERADMIN", "ADMIN", "HR");

                                        // Configurar el resto de los endpoints (no especificados)
                                        http.anyRequest().denyAll();
                                }).addFilterBefore(new JwtTokenValidator(jwtUtils), BasicAuthenticationFilter.class)
                                .build();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.addAllowedOrigin(allowedOrigin);
                configuration.addAllowedMethod("*"); // Permitir todos los métodos (GET, POST, etc.)
                configuration.addAllowedHeader("*"); // Permitir todos los encabezados
                configuration.setAllowCredentials(true); // Permitir cookies/credenciales

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration); // Aplicar a todas las rutas
                return source;
        }

        @Bean
        public AuthenticationManager authenticationManager() throws Exception {
                return authenticationConfiguration.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
