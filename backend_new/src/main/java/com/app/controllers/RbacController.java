package com.app.controllers;

import com.app.dto.rbac.MenuItemDTO;
import com.app.dto.rbac.UserPermissionsDTO;
import com.app.services.RbacService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rbac")
public class RbacController {

    private final RbacService rbacService;

    public RbacController(RbacService rbacService) {
        this.rbacService = rbacService;
    }

    /**
     * Devuelve el menú disponible para los roles del usuario autenticado
     */
    @GetMapping("/menu")
    public Mono<ResponseEntity<List<MenuItemDTO>>> getMenu() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .flatMap(auth -> {
                    List<String> userRoles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .map(r -> r.replace("ROLE_", ""))
                            .collect(Collectors.toList());
                    
                    Long customerId = null;
                    if (auth.getDetails() instanceof java.util.Map map) {
                        Object cid = map.get("customer_id");
                        if (cid instanceof Number n) customerId = n.longValue();
                    }
                    
                    return rbacService.generateMenuForRoles(userRoles, customerId, auth.getName());
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.status(401).build());
    }

    /**
     * Devuelve los permisos y roles del usuario actual
     */
    @GetMapping("/my-permissions")
    public Mono<ResponseEntity<UserPermissionsDTO>> getMyPermissions() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication())
                .map(auth -> {
                    List<String> roles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .map(r -> r.replace("ROLE_", ""))
                            .collect(Collectors.toList());
                    
                    return ResponseEntity.ok(UserPermissionsDTO.builder()
                            .username(auth.getName())
                            .roles(roles)
                            .build());
                })
                .defaultIfEmpty(ResponseEntity.status(401).build());
    }
}
