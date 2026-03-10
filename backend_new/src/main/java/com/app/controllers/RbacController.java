package com.app.controllers;

import com.app.dto.MenuItemDto;
import com.app.dto.UserPermissionsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rbac")
@RequiredArgsConstructor
@Slf4j
public class RbacController {

        @GetMapping("/my-permissions")
        public Mono<ResponseEntity<UserPermissionsDto>> getMyPermissions() {
                return ReactiveSecurityContextHolder.getContext()
                                .map(SecurityContext::getAuthentication)
                                .map(auth -> {
                                        List<String> roles = auth.getAuthorities().stream()
                                                        .map(GrantedAuthority::getAuthority)
                                                        .map(a -> a.replace("ROLE_", ""))
                                                        .collect(Collectors.toList());

                                        // Hardcoded menu and permissions for now to allow progress
                                        // In a future step, this should be moved to a Service that uses the DB
                                        List<MenuItemDto> menu = new ArrayList<>();
                                        menu.add(MenuItemDto.builder()
                                                        .label("Dashboard")
                                                        .href("/home")
                                                        .icon("tabler-smart-home")
                                                        .build());

                                        UserPermissionsDto permissionsDto = UserPermissionsDto.builder()
                                                        .username(auth.getName())
                                                        .roles(roles)
                                                        .permissions(Set.of("dashboard.view", "customers.view",
                                                                        "customers.create"))
                                                        .modules(List.of("DASHBOARD", "CUSTOMERS"))
                                                        .menu(menu)
                                                        .build();

                                        return ResponseEntity.ok(permissionsDto);
                                });
        }

        @GetMapping("/menu")
        public Mono<ResponseEntity<List<MenuItemDto>>> getMenu() {
                return ReactiveSecurityContextHolder.getContext()
                                .map(SecurityContext::getAuthentication)
                                .map(auth -> {
                                        log.info("RbacController: auth name: {}",
                                                        auth != null ? auth.getName() : "null");
                                        List<String> roles = auth.getAuthorities().stream()
                                                        .map(GrantedAuthority::getAuthority)
                                                        .map(a -> a.replace("ROLE_", ""))
                                                        .collect(Collectors.toList());
                                        log.info("RbacController: roles: {}", roles);

                                        List<MenuItemDto> menu = generateMenuByRoles(roles);
                                        log.info("RbacController: menu items: {}", menu.size());
                                        return ResponseEntity.ok(menu);
                                });
        }

        private List<MenuItemDto> generateMenuByRoles(List<String> roles) {
                List<MenuItemDto> menu = new ArrayList<>();
                log.info("generateMenuByRoles: processing roles: {}", roles);
                boolean isAdmin = roles.stream()
                                .map(String::toUpperCase)
                                .map(r -> r.replace("ROLE_", "").trim())
                                .anyMatch(r -> r.equals("ADMIN") || r.equals("MANAGER"));
                log.info("generateMenuByRoles: isAdmin detected: {}", isAdmin);

                // Dashboard
                menu.add(MenuItemDto.builder()
                                .label("Dashboard")
                                .href("/home")
                                .icon("tabler-smart-home")
                                .build());

                if (isAdmin) {
                        // Ventas
                        List<MenuItemDto> salesChildren = new ArrayList<>();
                        salesChildren.add(MenuItemDto.builder().label("Cotizaciones").href("/ventas/cotizaciones/list")
                                        .build());
                        salesChildren.add(MenuItemDto.builder().label("Pedidos").href("/ventas/pedidos").build());
                        salesChildren.add(
                                        MenuItemDto.builder().label("Facturas").href("/ventas/facturas/list").build());
                        salesChildren.add(MenuItemDto.builder().label("Productos").href("/ventas/productos/list")
                                        .build());

                        menu.add(MenuItemDto.builder()
                                        .label("Ventas")
                                        .icon("tabler-shopping-cart")
                                        .children(salesChildren)
                                        .build());

                        // Contabilidad
                        List<MenuItemDto> accountingChildren = new ArrayList<>();
                        accountingChildren.add(MenuItemDto.builder().label("Plan de Cuentas")
                                        .href("/contabilidad/plan-cuentas").build());
                        accountingChildren.add(MenuItemDto.builder().label("Libro Diario")
                                        .href("/contabilidad/libro-diario").build());
                        accountingChildren.add(MenuItemDto.builder().label("Estado Resultados")
                                        .href("/contabilidad/estado-resultados").build());
                        accountingChildren.add(MenuItemDto.builder().label("Balance General")
                                        .href("/contabilidad/balance-general").build());

                        menu.add(MenuItemDto.builder()
                                        .label("Contabilidad")
                                        .icon("tabler-calculator")
                                        .children(accountingChildren)
                                        .build());

                        // Recursos Humanos
                        List<MenuItemDto> hrChildren = new ArrayList<>();
                        hrChildren.add(MenuItemDto.builder().label("Dashboard").href("/hr/dashboard")
                                        .icon("tabler-chart-pie").build());
                        hrChildren.add(MenuItemDto.builder().label("Empleados").href("/hr/employees")
                                        .icon("tabler-user-circle").build());
                        hrChildren.add(MenuItemDto.builder().label("Conceptos de Nómina").href("/hr/concepts")
                                        .icon("tabler-list-details").build());
                        hrChildren.add(MenuItemDto.builder().label("Periodos de Nómina").href("/hr/periods")
                                        .icon("tabler-calendar-stats").build());

                        menu.add(MenuItemDto.builder()
                                        .label("Recursos Humanos")
                                        .icon("tabler-users")
                                        .children(hrChildren)
                                        .build());

                        // Usuarios y Roles
                        List<MenuItemDto> usersChildren = new ArrayList<>();
                        usersChildren.add(MenuItemDto.builder().label("Gestión de Usuarios").href("/accounts/user/list")
                                        .build());
                        usersChildren.add(MenuItemDto.builder().label("Roles y Permisos").href("/settings/roles/list")
                                        .build());

                        menu.add(MenuItemDto.builder()
                                        .label("Usuarios y Roles")
                                        .icon("tabler-shield-lock")
                                        .children(usersChildren)
                                        .build());

                        // Administración
                        List<MenuItemDto> adminChildren = new ArrayList<>();
                        adminChildren.add(MenuItemDto.builder().label("Clientes").href("/administracion/clientes/list")
                                        .build());
                        adminChildren.add(MenuItemDto.builder().label("Planes").href("/administracion/planes").build());
                        adminChildren.add(
                                        MenuItemDto.builder().label("Módulos").href("/administracion/modules").build());
                        adminChildren.add(MenuItemDto.builder().label("Suscripciones")
                                        .href("/administracion/suscripciones").build());
                        adminChildren.add(
                                        MenuItemDto.builder().label("Consumo").href("/administracion/consumo").build());

                        menu.add(MenuItemDto.builder()
                                        .label("Administración")
                                        .icon("tabler-settings")
                                        .children(adminChildren)
                                        .build());

                        // Reportes
                        menu.add(MenuItemDto.builder()
                                        .label("Reportes")
                                        .href("/reportes")
                                        .icon("tabler-info-circle")
                                        .build());
                }

                return menu;
        }

        // --- Gestión de Módulos (Basado en versión anterior) ---

        @GetMapping("/modules-list")
        public Flux<ModuleDto> getAllModulesList() {
                log.info("GET /api/rbac/modules-list - Fetching all modules");
                return Flux.just(
                                ModuleDto.builder().id(1L).name("Dashboard").code("DASHBOARD").active(true).build(),
                                ModuleDto.builder().id(2L).name("Ventas").code("SALES").active(true).build(),
                                ModuleDto.builder().id(3L).name("Contabilidad").code("ACCOUNTING").active(true).build(),
                                ModuleDto.builder().id(4L).name("Recursos Humanos").code("HR").active(true).build());
        }

        @GetMapping("/modules/{id}")
        public Mono<ResponseEntity<ModuleDto>> getModuleById(@PathVariable Long id) {
                log.info("GET /api/rbac/modules/{} - Fetching module", id);
                return Mono.just(ResponseEntity.ok(
                                ModuleDto.builder().id(id).name("Modulo " + id).code("MOD" + id).active(true).build()));
        }

        @PostMapping("/modules")
        public Mono<ResponseEntity<ModuleDto>> createModule(@RequestBody ModuleDto request) {
                log.info("POST /api/rbac/modules - Creating module {}", request.getCode());
                request.setId(System.currentTimeMillis());
                return Mono.just(ResponseEntity.ok(request));
        }

        @PutMapping("/modules/{id}")
        public Mono<ResponseEntity<ModuleDto>> updateModule(@PathVariable Long id, @RequestBody ModuleDto request) {
                log.info("PUT /api/rbac/modules/{} - Updating module", id);
                request.setId(id);
                return Mono.just(ResponseEntity.ok(request));
        }

        @DeleteMapping("/modules/{id}")
        public Mono<ResponseEntity<Void>> deleteModule(@PathVariable Long id) {
                log.info("DELETE /api/rbac/modules/{} - Deleting module", id);
                return Mono.just(ResponseEntity.noContent().build());
        }

        @lombok.Data
        @lombok.Builder
        @lombok.NoArgsConstructor
        @lombok.AllArgsConstructor
        public static class ModuleDto {
                private Long id;
                private String name;
                private String code;
                private boolean active;
        }
}
