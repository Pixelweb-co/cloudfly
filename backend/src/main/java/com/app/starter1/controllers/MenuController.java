package com.app.starter1.controllers;

import com.app.starter1.dto.menu.MenuItemDTO;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.entity.rbac.Role;
import com.app.starter1.persistence.repository.UserRepository;
import com.app.starter1.persistence.repository.rbac.RbacRoleRepository;
import com.app.starter1.persistence.services.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
@Slf4j
public class MenuController {

    private final MenuService menuService;
    private final UserRepository userRepository;
    private final RbacRoleRepository rbacRoleRepository;

    /**
     * Obtiene el menú completo del sistema
     * Este endpoint es usado por el frontend para renderizar el menú vertical
     */
    @GetMapping
    public ResponseEntity<List<MenuItemDTO>> getMenu() {
        List<MenuItemDTO> menuData = menuService.getMenuData();
        return ResponseEntity.ok(menuData);
    }

    /**
     * Endpoint de diagnóstico para verificar roles y permisos del usuario
     */
    @GetMapping("/debug")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getMenuDebug() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);

        Map<String, Object> debug = new HashMap<>();
        debug.put("username", username);

        if (user == null) {
            debug.put("error", "Usuario no encontrado");
            return ResponseEntity.ok(debug);
        }

        // Legacy roles
        List<String> legacyRoles = user.getRoles().stream()
                .map(r -> r.getRole())
                .collect(Collectors.toList());
        debug.put("legacyRoles", legacyRoles);

        // RBAC roles
        List<Long> roleIds = user.getRoles().stream()
                .map(r -> r.getId())
                .collect(Collectors.toList());
        List<Role> rbacRoles = rbacRoleRepository.findAllById(roleIds);

        List<Map<String, Object>> rbacRolesInfo = rbacRoles.stream().map(role -> {
            Map<String, Object> roleInfo = new HashMap<>();
            roleInfo.put("id", role.getId());
            roleInfo.put("code", role.getCode());
            roleInfo.put("name", role.getName());
            roleInfo.put("permissionsCount", role.getPermissions() != null ? role.getPermissions().size() : 0);
            return roleInfo;
        }).collect(Collectors.toList());

        debug.put("rbacRoles", rbacRolesInfo);

        boolean isSuperAdmin = rbacRoles.stream()
                .anyMatch(r -> "SUPERADMIN".equals(r.getCode()) || "ADMIN".equals(r.getCode())
                        || "MANAGER".equals(r.getCode()));
        debug.put("isSuperAdmin", isSuperAdmin);

        // Menú generado
        List<MenuItemDTO> menu = menuService.getMenuData();
        debug.put("menuItemsCount", menu.size());
        debug.put("menu", menu);

        return ResponseEntity.ok(debug);
    }
}
