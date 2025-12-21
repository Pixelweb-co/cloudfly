package com.app.starter1.controllers;

import com.app.starter1.dto.rbac.*;
import com.app.starter1.services.rbac.RbacService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * RBAC Controller - Endpoints for roles, permissions, and dynamic menu
 */
@RestController
@RequestMapping("/api/rbac")
@RequiredArgsConstructor
@Slf4j
public class RbacController {

    private final RbacService rbacService;

    // ========================
    // MENU & PERMISSIONS (Current User)
    // ========================

    /**
     * Get menu for current authenticated user
     * This replaces the static verticalMenuData.json
     * If tenantId is provided, filters by subscription modules
     */
    @GetMapping("/menu")
    public ResponseEntity<List<MenuItemDTO>> getMenu(@RequestParam(required = false) Long tenantId) {
        List<String> roleCodes = getCurrentUserRoles();
        log.info("GET /api/rbac/menu - Generating menu for roles: {}, tenantId: {}", roleCodes, tenantId);

        if (tenantId != null) {
            // Filter by subscription modules
            return ResponseEntity.ok(rbacService.generateMenu(roleCodes, tenantId));
        } else {
            // Just role-based filtering (no subscription)
            return ResponseEntity.ok(rbacService.generateMenu(roleCodes));
        }
    }

    /**
     * Get all permissions for current user
     */
    @GetMapping("/my-permissions")
    public ResponseEntity<UserPermissionsDTO> getMyPermissions() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        List<String> roleCodes = getCurrentUserRoles();

        log.info("GET /api/rbac/my-permissions - User: {}, Roles: {}", auth.getName(), roleCodes);

        // Note: userId would need to be extracted from a custom UserDetails
        // implementation
        // For now, we pass null and let the frontend handle it
        UserPermissionsDTO permissions = rbacService.getUserPermissions(null, auth.getName(), roleCodes);
        return ResponseEntity.ok(permissions);
    }

    /**
     * Check if current user has a specific permission
     */
    @GetMapping("/check")
    public ResponseEntity<Boolean> checkPermission(
            @RequestParam String module,
            @RequestParam String action) {
        List<String> roleCodes = getCurrentUserRoles();
        boolean hasPermission = rbacService.hasPermission(roleCodes, module, action);
        log.debug("CHECK permission {}.{} for roles {}: {}", module, action, roleCodes, hasPermission);
        return ResponseEntity.ok(hasPermission);
    }

    // ========================
    // ROLE MANAGEMENT (Admin only)
    // ========================

    /**
     * Get all roles
     */
    @GetMapping("/roles")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        log.info("GET /api/rbac/roles - Fetching all roles");
        return ResponseEntity.ok(rbacService.getAllRoles());
    }

    /**
     * Get role by ID
     */
    @GetMapping("/roles/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<RoleDTO> getRoleById(@PathVariable Long id) {
        log.info("GET /api/rbac/roles/{} - Fetching role", id);
        return ResponseEntity.ok(rbacService.getRoleById(id));
    }

    /**
     * Get role by code
     */
    @GetMapping("/roles/code/{code}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<RoleDTO> getRoleByCode(@PathVariable String code) {
        log.info("GET /api/rbac/roles/code/{} - Fetching role", code);
        return ResponseEntity.ok(rbacService.getRoleByCode(code));
    }

    /**
     * Create a new role
     */
    @PostMapping("/roles")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<RoleDTO> createRole(@RequestBody RoleRequestDTO request) {
        log.info("POST /api/rbac/roles - Creating role: {}", request.getCode());
        return ResponseEntity.ok(rbacService.createRole(request));
    }

    /**
     * Update a role
     */
    @PutMapping("/roles/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<RoleDTO> updateRole(
            @PathVariable Long id,
            @RequestBody RoleRequestDTO request) {
        log.info("PUT /api/rbac/roles/{} - Updating role", id);
        return ResponseEntity.ok(rbacService.updateRole(id, request));
    }

    /**
     * Delete a role
     */
    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        log.info("DELETE /api/rbac/roles/{} - Deleting role", id);
        rbacService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    // ========================
    // MODULES & ACTIONS (For permission matrix)
    // ========================

    /**
     * Get all modules (simple list for management)
     */
    @GetMapping("/modules-list")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<List<ModuleDTO>> getAllModulesList() {
        log.info("GET /api/rbac/modules-list - Fetching all modules");
        return ResponseEntity.ok(rbacService.getAllModules());
    }

    /**
     * Get module by ID
     */
    @GetMapping("/modules/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<ModuleDTO> getModuleById(@PathVariable Long id) {
        log.info("GET /api/rbac/modules/{} - Fetching module", id);
        return ResponseEntity.ok(rbacService.getModuleById(id));
    }

    /**
     * Create module
     */
    @PostMapping("/modules")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<ModuleDTO> createModule(@RequestBody @jakarta.validation.Valid ModuleCreateDTO request) {
        log.info("POST /api/rbac/modules - Creating module {}", request.code());
        return ResponseEntity.ok(rbacService.createModule(request));
    }

    /**
     * Update module
     */
    @PutMapping("/modules/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<ModuleDTO> updateModule(@PathVariable Long id,
            @RequestBody @jakarta.validation.Valid ModuleCreateDTO request) {
        log.info("PUT /api/rbac/modules/{} - Updating module", id);
        return ResponseEntity.ok(rbacService.updateModule(id, request));
    }

    /**
     * Delete module
     */
    @DeleteMapping("/modules/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Void> deleteModule(@PathVariable Long id) {
        log.info("DELETE /api/rbac/modules/{} - Deleting module", id);
        rbacService.deleteModule(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all modules with their actions for the permission matrix UI
     */
    @GetMapping("/modules")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<List<ModulePermissionDTO>> getAllModules() {
        log.info("GET /api/rbac/modules - Fetching all modules with actions");
        return ResponseEntity.ok(rbacService.getAllModulesWithActions());
    }

    // ========================
    // HELPERS
    // ========================

    private List<String> getCurrentUserRoles() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.replace("ROLE_", ""))
                .collect(Collectors.toList());
    }
}
