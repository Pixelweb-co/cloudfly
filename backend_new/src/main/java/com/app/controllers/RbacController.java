package com.app.controllers;

import com.app.dto.MenuItemDto;
import com.app.dto.UserPermissionsDto;
import com.app.persistence.entity.ModuleEntity;
import com.app.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rbac")
@RequiredArgsConstructor
@Slf4j
public class RbacController {

    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionModuleRepository subscriptionModuleRepository;

    @GetMapping("/my-permissions")
    public Mono<ResponseEntity<UserPermissionsDto>> getMyPermissions() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    List<String> roles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .map(a -> a.replace("ROLE_", ""))
                            .collect(Collectors.toList());

                    return getActiveModuleCodes(auth.getName(), roles)
                            .flatMap(modules -> {
                                List<MenuItemDto> menu = generateFilteredMenu(roles, modules);
                                
                                UserPermissionsDto permissionsDto = UserPermissionsDto.builder()
                                        .username(auth.getName())
                                        .roles(roles)
                                        .permissions(Set.of("dashboard.view", "customers.view", "customers.create", "settings.all"))
                                        .modules(modules)
                                        .menu(menu)
                                        .build();

                                return Mono.just(ResponseEntity.ok(permissionsDto));
                            });
                });
    }

    @GetMapping("/menu")
    public Mono<ResponseEntity<List<MenuItemDto>>> getMenu() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .flatMap(auth -> {
                    List<String> roles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .map(a -> a.replace("ROLE_", ""))
                            .collect(Collectors.toList());

                    return getActiveModuleCodes(auth.getName(), roles)
                            .map(modules -> {
                                List<MenuItemDto> menu = generateFilteredMenu(roles, modules);
                                return ResponseEntity.ok(menu);
                            });
                });
    }

    private Mono<List<String>> getActiveModuleCodes(String username, List<String> roles) {
        boolean isManager = roles.stream().anyMatch(r -> r.equals("MANAGER") || r.equals("SUPERADMIN"));
        
        if (isManager) {
            log.info("User {} is MANAGER/SUPERADMIN - Granting all modules", username);
            return moduleRepository.findAll()
                    .map(ModuleEntity::getCode)
                    .collectList();
        }

        return userRepository.findByUsername(username)
                .flatMap(user -> {
                    if (user.getCustomerId() == null) {
                        return Mono.just(List.of("DASHBOARD")); // Solo dashboard para usuarios sin organización
                    }
                    return subscriptionRepository.findFirstByCustomerIdAndStatusOrderByEndDateDesc(user.getCustomerId(), "ACTIVE")
                            .flatMap(sub -> subscriptionModuleRepository.findBySubscriptionId(sub.getId())
                                    .filter(sm -> sm.getModuleId() != null)
                                    .flatMap(sm -> moduleRepository.findById(sm.getModuleId()))
                                    .map(ModuleEntity::getCode)
                                    .collectList())
                            .defaultIfEmpty(List.of("DASHBOARD"));
                })
                .defaultIfEmpty(List.of("DASHBOARD"));
    }

    private List<MenuItemDto> generateFilteredMenu(List<String> roles, List<String> activeModules) {
        List<MenuItemDto> menu = new ArrayList<>();
        boolean isAdmin = roles.stream().anyMatch(r -> r.equals("ADMIN") || r.equals("MANAGER") || r.equals("SUPERADMIN"));

        // Dashboard siempre visible
        menu.add(MenuItemDto.builder()
                .label("Dashboard")
                .href("/home")
                .icon("tabler-smart-home")
                .build());

        if (isAdmin) {
            // Ventas
            if (activeModules.contains("SALES")) {
                List<MenuItemDto> salesChildren = new ArrayList<>();
                salesChildren.add(MenuItemDto.builder().label("Cotizaciones").href("/ventas/cotizaciones/list").build());
                salesChildren.add(MenuItemDto.builder().label("Pedidos").href("/ventas/pedidos").build());
                salesChildren.add(MenuItemDto.builder().label("Facturas").href("/ventas/facturas/list").build());
                salesChildren.add(MenuItemDto.builder().label("Productos").href("/ventas/productos/list").build());
                menu.add(MenuItemDto.builder().label("Ventas").icon("tabler-shopping-cart").children(salesChildren).build());
            }

            // Contabilidad
            if (activeModules.contains("ACCOUNTING")) {
                List<MenuItemDto> accountingChildren = new ArrayList<>();
                accountingChildren.add(MenuItemDto.builder().label("Plan de Cuentas").href("/contabilidad/plan-cuentas").build());
                accountingChildren.add(MenuItemDto.builder().label("Libro Diario").href("/contabilidad/libro-diario").build());
                accountingChildren.add(MenuItemDto.builder().label("Estado Resultados").href("/contabilidad/estado-resultados").build());
                accountingChildren.add(MenuItemDto.builder().label("Balance General").href("/contabilidad/balance-general").build());
                menu.add(MenuItemDto.builder().label("Contabilidad").icon("tabler-calculator").children(accountingChildren).build());
            }

            // Recursos Humanos
            if (activeModules.contains("HR")) {
                List<MenuItemDto> hrChildren = new ArrayList<>();
                hrChildren.add(MenuItemDto.builder().label("Dashboard").href("/hr/dashboard").icon("tabler-chart-pie").build());
                hrChildren.add(MenuItemDto.builder().label("Empleados").href("/hr/employees").icon("tabler-user-circle").build());
                hrChildren.add(MenuItemDto.builder().label("Conceptos de Nómina").href("/hr/concepts").icon("tabler-list-details").build());
                hrChildren.add(MenuItemDto.builder().label("Periodos de Nómina").href("/hr/periods").icon("tabler-calendar-stats").build());
                menu.add(MenuItemDto.builder().label("Recursos Humanos").icon("tabler-users").children(hrChildren).build());
            }

            // Usuarios y Roles
            if (activeModules.contains("RBAC")) {
                List<MenuItemDto> usersChildren = new ArrayList<>();
                usersChildren.add(MenuItemDto.builder().label("Gestión de Usuarios").href("/accounts/user/list").build());
                usersChildren.add(MenuItemDto.builder().label("Roles y Permisos").href("/settings/roles/list").build());
                menu.add(MenuItemDto.builder().label("Usuarios y Roles").icon("tabler-shield-lock").children(usersChildren).build());
            }

            // Administración (Configuración de la plataforma)
            if (roles.contains("SUPERADMIN") || roles.contains("MANAGER")) {
                List<MenuItemDto> adminChildren = new ArrayList<>();
                adminChildren.add(MenuItemDto.builder().label("Clientes").href("/administracion/clientes/list").build());
                adminChildren.add(MenuItemDto.builder().label("Planes").href("/administracion/planes").build());
                adminChildren.add(MenuItemDto.builder().label("Módulos").href("/administracion/modules").build());
                adminChildren.add(MenuItemDto.builder().label("Suscripciones").href("/administracion/suscripciones").build());
                adminChildren.add(MenuItemDto.builder().label("Compañías").href("/administracion/companies").build());
                adminChildren.add(MenuItemDto.builder().label("Consumo").href("/administracion/consumo").build());
                menu.add(MenuItemDto.builder().label("Administración").icon("tabler-settings").children(adminChildren).build());
            }

            // Reportes
            if (activeModules.contains("REPORTS")) {
                menu.add(MenuItemDto.builder().label("Reportes").href("/reportes").icon("tabler-info-circle").build());
            }
        }

        return menu;
    }

    @GetMapping("/modules-list")
    public Flux<ModuleDto> getAllModulesList() {
        log.info("GET /api/rbac/modules-list - Fetching all modules from DB");
        return moduleRepository.findAll().map(this::mapToDto);
    }

    @GetMapping("/modules/{id}")
    public Mono<ResponseEntity<ModuleDto>> getModuleById(@PathVariable Long id) {
        log.info("GET /api/rbac/modules/{} - Fetching module", id);
        return moduleRepository.findById(id).map(m -> ResponseEntity.ok(mapToDto(m))).defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/modules")
    public Mono<ResponseEntity<ModuleDto>> createModule(@RequestBody ModuleDto request) {
        log.info("POST /api/rbac/modules - Creating module {}", request.getCode());
        ModuleEntity entity = mapToEntity(request);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        entity.setIsActive(true);
        return moduleRepository.save(entity).map(saved -> ResponseEntity.ok(mapToDto(saved)));
    }

    @PutMapping("/modules/{id}")
    public Mono<ResponseEntity<ModuleDto>> updateModule(@PathVariable Long id, @RequestBody ModuleDto request) {
        log.info("PUT /api/rbac/modules/{} - Updating module", id);
        return moduleRepository.findById(id).flatMap(existing -> {
            existing.setName(request.getName());
            existing.setCode(request.getCode());
            existing.setDescription(request.getDescription());
            existing.setIcon(request.getIcon());
            existing.setMenuPath(request.getMenuPath());
            existing.setMenuItems(request.getMenuItems());
            existing.setDisplayOrder(request.getDisplayOrder());
            existing.setIsActive(request.getIsActive());
            existing.setUpdatedAt(LocalDateTime.now());
            return moduleRepository.save(existing);
        }).map(saved -> ResponseEntity.ok(mapToDto(saved))).defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/modules/{id}")
    public Mono<ResponseEntity<Void>> deleteModule(@PathVariable Long id) {
        log.info("DELETE /api/rbac/modules/{} - Deleting module", id);
        return moduleRepository.deleteById(id).then(Mono.just(ResponseEntity.noContent().build()));
    }

    private ModuleDto mapToDto(ModuleEntity entity) {
        return ModuleDto.builder().id(entity.getId()).name(entity.getName()).code(entity.getCode()).description(entity.getDescription()).icon(entity.getIcon()).menuPath(entity.getMenuPath()).displayOrder(entity.getDisplayOrder()).isActive(entity.getIsActive()).menuItems(entity.getMenuItems()).build();
    }

    private ModuleEntity mapToEntity(ModuleDto dto) {
        return ModuleEntity.builder().id(dto.getId()).name(dto.getName()).code(dto.getCode()).description(dto.getDescription()).icon(dto.getIcon()).menuPath(dto.getMenuPath()).displayOrder(dto.getDisplayOrder()).isActive(dto.getIsActive()).menuItems(dto.getMenuItems()).build();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ModuleDto {
        private Long id;
        private String name;
        private String code;
        private String description;
        private String icon;
        private String menuPath;
        private Integer displayOrder;
        private Boolean isActive;
        private String menuItems;
    }
}

