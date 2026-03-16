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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

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

                    return getActiveModules(auth.getName(), roles)
                            .flatMap(modules -> {
                                List<MenuItemDto> menu = generateDynamicMenu(roles, modules);
                                
                                UserPermissionsDto permissionsDto = UserPermissionsDto.builder()
                                        .username(auth.getName())
                                        .roles(roles)
                                        .permissions(Set.of("dashboard.view", "customers.view", "customers.create", "settings.all"))
                                        .modules(modules.stream().map(com.app.persistence.entity.ModuleEntity::getCode).collect(Collectors.toList()))
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

                    return getActiveModules(auth.getName(), roles)
                            .map(modules -> {
                                List<MenuItemDto> menu = generateDynamicMenu(roles, modules);
                                return ResponseEntity.ok(menu);
                            });
                });
    }

    private Mono<List<ModuleEntity>> getActiveModules(String username, List<String> roles) {
        boolean isPowerful = roles.stream().anyMatch(r -> r.equals("MANAGER") || r.equals("SUPERADMIN"));
        
        if (isPowerful) {
            log.info("👑 [RBAC] User {} is MANAGER/SUPERADMIN - Granting all modules.", username);
            return moduleRepository.findAll().collectList();
        }

        return userRepository.findByUsername(username)
                .flatMap(user -> {
                    Long customerId = user.getCustomerId();
                    if (customerId != null) {
                        log.info("🏢 [RBAC] User {} associated with customer {}. Checking for active subscription...", username, customerId);
                        return subscriptionRepository.findFirstByCustomerIdAndStatusOrderByEndDateDesc(customerId, "ACTIVE")
                                .flatMap(sub -> {
                                    log.info("📄 [RBAC] Found active subscription {} for customer {}", sub.getId(), customerId);
                                    return subscriptionModuleRepository.findBySubscriptionId(sub.getId())
                                            .filter(sm -> sm.getModuleId() != null)
                                            .flatMap(sm -> moduleRepository.findById(sm.getModuleId()))
                                            .collectList();
                                })
                                .doOnNext(modules -> log.info("✅ [RBAC] Granting {} modules to user {}", modules.size(), username))
                                .defaultIfEmpty(new ArrayList<>());
                    }
                    log.warn("⚠️ [RBAC] User {} has no customerId. Empty menu.", username);
                    return Mono.just(new ArrayList<ModuleEntity>());
                })
                .defaultIfEmpty(new ArrayList<>());
    }

    private List<MenuItemDto> generateDynamicMenu(List<String> roles, List<ModuleEntity> modules) {
        List<MenuItemDto> menu = new ArrayList<>();
        
        // El Dashboard siempre es el primero
        menu.add(MenuItemDto.builder()
                .label("Dashboard")
                .href("/home")
                .icon("tabler-smart-home")
                .displayOrder(0)
                .build());

        for (ModuleEntity module : modules) {
            String menuItemsJson = module.getMenuItems();
            if (menuItemsJson != null && !menuItemsJson.isEmpty()) {
                try {
                    // Convertir el JSON de menu_items a una lista de MenuItemDto
                    ObjectMapper mapper = new ObjectMapper();
                    List<MenuItemDto> children = mapper.readValue(menuItemsJson, new TypeReference<List<MenuItemDto>>(){});
                    
                    menu.add(MenuItemDto.builder()
                            .label(module.getName())
                            .icon(module.getIcon())
                            .href(module.getMenuPath())
                            .displayOrder(module.getDisplayOrder())
                            .children(children)
                            .build());
                } catch (Exception e) {
                    log.error("Error parsing menu items for module {}: {}", module.getCode(), e.getMessage());
                }
            } else {
                // Módulo sin sub-ítems
                menu.add(MenuItemDto.builder()
                        .label(module.getName())
                        .icon(module.getIcon())
                        .href(module.getMenuPath())
                        .displayOrder(module.getDisplayOrder())
                        .build());
            }
        }

        // Ordenar el menú por displayOrder
        return menu.stream()
                .sorted((a, b) -> {
                    int orderA = a.getDisplayOrder() != null ? a.getDisplayOrder() : 99;
                    int orderB = b.getDisplayOrder() != null ? b.getDisplayOrder() : 99;
                    return Integer.compare(orderA, orderB);
                })
                .collect(Collectors.toList());
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

