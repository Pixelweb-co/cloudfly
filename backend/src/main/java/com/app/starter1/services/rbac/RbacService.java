package com.app.starter1.services.rbac;

import com.app.starter1.dto.rbac.*;
import com.app.starter1.persistence.entity.rbac.*;
import com.app.starter1.persistence.repository.rbac.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Main RBAC Service - Handles permissions, roles, and menu generation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RbacService {

    private final RbacModuleRepository moduleRepository;
    private final ModuleActionRepository moduleActionRepository;
    private final RbacRoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final com.app.starter1.persistence.services.SubscriptionService subscriptionService;

    // ========================
    // PERMISSION CHECKING
    // ========================

    /**
     * Check if roles have a specific permission
     */
    public boolean hasPermission(List<String> roleCodes, String moduleCode, String actionCode) {
        if (roleCodes.contains("SUPERADMIN")) {
            return true; // SUPERADMIN has all permissions
        }
        return rolePermissionRepository.hasPermission(roleCodes, moduleCode, actionCode);
    }

    /**
     * Get all permissions for given roles
     */
    public Set<String> getPermissions(List<String> roleCodes) {
        if (roleCodes.contains("SUPERADMIN")) {
            // SUPERADMIN gets all permissions
            return moduleActionRepository.findAll().stream()
                    .map(ma -> ma.getModule().getCode() + "." + ma.getCode())
                    .collect(Collectors.toSet());
        }

        return rolePermissionRepository.findGrantedPermissionsByRoleCodes(roleCodes).stream()
                .map(rp -> rp.getModuleAction().getPermissionKey())
                .collect(Collectors.toSet());
    }

    /**
     * Get modules that user has access to
     */
    public List<String> getAccessibleModules(List<String> roleCodes) {
        if (roleCodes.contains("SUPERADMIN")) {
            return moduleRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                    .map(RbacModule::getCode)
                    .collect(Collectors.toList());
        }

        return moduleRepository.findModulesByRoleCodes(roleCodes).stream()
                .map(RbacModule::getCode)
                .collect(Collectors.toList());
    }

    // ========================
    // MENU GENERATION
    // ========================

    /**
     * Generate menu structure based on user roles
     * Now builds menu dynamically from database menu_items
     */
    public List<MenuItemDTO> generateMenu(List<String> roleCodes) {
        boolean isSuperAdmin = roleCodes.contains("SUPERADMIN");
        List<MenuItemDTO> menu = new ArrayList<>();

        // Dashboard - everyone with any permission gets this
        if (isSuperAdmin || !roleCodes.isEmpty()) {
            menu.add(MenuItemDTO.builder()
                    .label("Dashboard")
                    .href("/home")
                    .icon("tabler-smart-home")
                    .build());
        }

        // Get all accessible modules based on role permissions
        List<RbacModule> accessibleModules;
        if (isSuperAdmin) {
            // SUPERADMIN sees all active modules
            accessibleModules = moduleRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        } else {
            // Get only modules where user has at least one permission
            accessibleModules = moduleRepository.findModulesByRoleCodes(roleCodes);
        }

        // Build menu from modules
        for (RbacModule module : accessibleModules) {
            // Get user's granted permissions for this specific module
            Set<String> userModulePermissions = getUserPermissionsForModule(roleCodes, module.getCode());

            List<MenuItemDTO> children = parseMenuItems(module.getMenuItems(), userModulePermissions, isSuperAdmin);

            // Only add parent if it has children (after permission filtering)
            if (!children.isEmpty()) {
                menu.add(MenuItemDTO.builder()
                        .label(module.getName())
                        .icon(module.getIcon())
                        .href(module.getMenuPath()) // May be null for parents
                        .moduleCode(module.getCode()) // Código del módulo para frontend
                        .children(children)
                        .build());
            }
        }

        return menu;
    }

    /**
     * Get user's specific action permissions for a module
     */
    private Set<String> getUserPermissionsForModule(List<String> roleCodes, String moduleCode) {
        if (roleCodes.contains("SUPERADMIN")) {
            // SUPERADMIN has all permissions
            return Set.of("*"); // Wildcard for all permissions
        }

        return rolePermissionRepository.findGrantedPermissionsByRoleCodes(roleCodes).stream()
                .filter(rp -> rp.getModuleAction().getModule().getCode().equalsIgnoreCase(moduleCode))
                .map(rp -> rp.getModuleAction().getCode().toUpperCase())
                .collect(Collectors.toSet());
    }

    /**
     * Parse menu_items JSON string to MenuItemDTO list, filtering by user
     * permissions
     * Example JSON:
     * [{"label":"Cotizaciones","href":"/ventas/cotizaciones","icon":"tabler-file","action":"VIEW"}]
     * If "action" is not specified or user is SUPERADMIN, the item is included
     */
    private List<MenuItemDTO> parseMenuItems(String menuItemsJson, Set<String> userPermissions, boolean isSuperAdmin) {
        if (menuItemsJson == null || menuItemsJson.trim().isEmpty()) {
            return List.of();
        }

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, String>>> typeRef = new com.fasterxml.jackson.core.type.TypeReference<List<java.util.Map<String, String>>>() {
            };

            List<java.util.Map<String, String>> items = mapper.readValue(menuItemsJson, typeRef);

            return items.stream()
                    .filter(item -> {
                        // If no action specified, show the item
                        String requiredAction = item.get("action");
                        if (requiredAction == null || requiredAction.isEmpty()) {
                            return true;
                        }

                        // SUPERADMIN sees everything
                        if (isSuperAdmin || userPermissions.contains("*")) {
                            return true;
                        }

                        // Check if user has the required permission
                        return userPermissions.contains(requiredAction.toUpperCase());
                    })
                    .map(item -> MenuItemDTO.builder()
                            .label(item.get("label"))
                            .href(item.get("href"))
                            .icon(item.getOrDefault("icon", null))
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to parse menu_items JSON: {}", menuItemsJson, e);
            return List.of();
        }
    }

    /**
     * Generate menu structure based on user roles AND tenant subscription
     * This filters the menu by both permissions and active subscription modules
     */
    public List<MenuItemDTO> generateMenu(List<String> roleCodes, Long tenantId) {
        boolean isSuperAdmin = roleCodes.contains("SUPERADMIN");

        // If SUPERADMIN, no subscription filtering - return full menu
        if (isSuperAdmin) {
            return generateMenu(roleCodes);
        }

        // Get tenant's active subscription modules
        try {
            var subscription = subscriptionService.getActiveTenantSubscription(tenantId);
            Set<String> subscriptionModuleCodes = subscription.moduleNames().stream()
                    .map(String::toUpperCase)
                    .collect(Collectors.toSet());

            log.info("Filtering menu for tenant {} with subscription modules: {}", tenantId, subscriptionModuleCodes);

            // Get modules that user has permission for AND are in the subscription
            List<RbacModule> accessibleModules = moduleRepository.findModulesByRoleCodes(roleCodes).stream()
                    .filter(module -> subscriptionModuleCodes.contains(module.getCode().toUpperCase()))
                    .collect(Collectors.toList());

            // Build menu
            List<MenuItemDTO> menu = new ArrayList<>();

            // Dashboard - everyone gets this
            menu.add(MenuItemDTO.builder()
                    .label("Dashboard")
                    .href("/home")
                    .icon("tabler-smart-home")
                    .build());

            // Add module menus
            for (RbacModule module : accessibleModules) {
                // Get user's granted permissions for this specific module
                Set<String> userModulePermissions = getUserPermissionsForModule(roleCodes, module.getCode());

                List<MenuItemDTO> children = parseMenuItems(module.getMenuItems(), userModulePermissions, false);

                if (!children.isEmpty()) {
                    menu.add(MenuItemDTO.builder()
                            .label(module.getName())
                            .icon(module.getIcon())
                            .href(module.getMenuPath())
                            .moduleCode(module.getCode()) // Código del módulo para frontend
                            .children(children)
                            .build());
                }
            }

            return menu;
        } catch (Exception e) {
            log.warn("No active subscription found for tenant {}. Returning empty menu.", tenantId);
            // No subscription = no access
            return List.of();
        }
    }

    /**
     * Filters menu items by allowed module codes
     */
    private List<MenuItemDTO> filterMenuByModules(List<MenuItemDTO> menu, Set<String> allowedModules) {
        return menu.stream()
                .map(item -> {
                    // If has children, filter children
                    if (item.getChildren() != null && !item.getChildren().isEmpty()) {
                        List<MenuItemDTO> filteredChildren = filterMenuByModules(item.getChildren(), allowedModules);
                        if (filteredChildren.isEmpty()) {
                            return null; // Remove parent if no children
                        }
                        return MenuItemDTO.builder()
                                .label(item.getLabel())
                                .href(item.getHref())
                                .icon(item.getIcon())
                                .children(filteredChildren)
                                .build();
                    }

                    // Leaf item - check if module is allowed
                    // Extract module from href (e.g., /ventas/... -> VENTAS)
                    if (item.getHref() != null) {
                        String moduleFromPath = extractModuleFromPath(item.getHref());
                        if (moduleFromPath != null && allowedModules.contains(moduleFromPath)) {
                            return item;
                        }
                    }

                    // Dashboard and settings always allowed
                    if (item.getLabel().equals("Dashboard") || item.getLabel().equals("Administración")) {
                        return item;
                    }

                    return null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * Extract module code from menu path
     */
    private String extractModuleFromPath(String path) {
        if (path == null || path.isEmpty())
            return null;

        String[] parts = path.split("/");
        if (parts.length > 1) {
            String module = parts[1]; // e.g., /ventas/productos -> ventas

            // Map paths to module codes
            return switch (module.toLowerCase()) {
                case "ventas" -> "SALES";
                case "contabilidad" -> "ACCOUNTING";
                case "hr" -> "HR";
                case "marketing", "comunicaciones" -> "MARKETING";
                case "reportes" -> "REPORTS";
                default -> module.toUpperCase();
            };
        }
        return null;
    }

    // ========================
    // USER PERMISSIONS
    // ========================

    /**
     * Get full permissions info for a user
     */
    public UserPermissionsDTO getUserPermissions(Long userId, String username, List<String> roleCodes) {
        Set<String> permissions = getPermissions(roleCodes);
        List<String> modules = getAccessibleModules(roleCodes);
        List<MenuItemDTO> menu = generateMenu(roleCodes);

        return UserPermissionsDTO.builder()
                .userId(userId)
                .username(username)
                .roles(roleCodes)
                .permissions(permissions)
                .modules(modules)
                .menu(menu)
                .build();
    }

    // ========================
    // ROLE MANAGEMENT
    // ========================

    /**
     * Get all roles
     */
    public List<RoleDTO> getAllRoles() {
        return roleRepository.findByIsActiveTrue().stream()
                .map(this::toRoleDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get role by code
     */
    public RoleDTO getRoleByCode(String code) {
        return roleRepository.findByCodeWithPermissions(code)
                .map(this::toRoleDTO)
                .orElseThrow(() -> new RuntimeException("Role not found: " + code));
    }

    /**
     * Get role by ID
     */
    public RoleDTO getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(this::toRoleDTO)
                .orElseThrow(() -> new RuntimeException("Role not found: " + id));
    }

    /**
     * Create a new role
     */
    @Transactional
    public RoleDTO createRole(RoleRequestDTO request) {
        if (roleRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Role code already exists: " + request.getCode());
        }

        Role role = Role.builder()
                .code(request.getCode().toUpperCase())
                .name(request.getName())
                .description(request.getDescription())
                .tenantId(request.getTenantId())
                .isSystem(false)
                .isActive(true)
                .build();

        role = roleRepository.save(role);

        // Assign permissions
        if (request.getPermissions() != null) {
            assignPermissions(role, request.getPermissions());
        }

        return toRoleDTO(role);
    }

    /**
     * Update an existing role
     */
    @Transactional
    public RoleDTO updateRole(Long id, RoleRequestDTO request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found: " + id));

        if (role.getIsSystem()) {
            throw new RuntimeException("Cannot modify system role: " + role.getCode());
        }

        role.setName(request.getName());
        role.setDescription(request.getDescription());

        // Clear and reassign permissions
        rolePermissionRepository.deleteAllByRoleId(role.getId());
        if (request.getPermissions() != null) {
            assignPermissions(role, request.getPermissions());
        }

        role = roleRepository.save(role);
        return toRoleDTO(role);
    }

    /**
     * Delete a role
     */
    @Transactional
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found: " + id));

        if (role.getIsSystem()) {
            throw new RuntimeException("Cannot delete system role: " + role.getCode());
        }

        roleRepository.delete(role);
    }

    /**
     * Get all modules with their actions for the permission matrix
     */
    public List<ModulePermissionDTO> getAllModulesWithActions() {
        return moduleRepository.findAllWithActions().stream()
                .map(module -> ModulePermissionDTO.builder()
                        .moduleId(module.getId())
                        .moduleCode(module.getCode())
                        .moduleName(module.getName())
                        .icon(module.getIcon())
                        .actions(module.getActions().stream()
                                .map(action -> ActionPermissionDTO.builder()
                                        .actionId(action.getId())
                                        .code(action.getCode())
                                        .name(action.getName())
                                        .granted(false) // Default, will be overridden when getting role permissions
                                        .build())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }

    // ========================
    // HELPERS
    // ========================

    private void assignPermissions(Role role, List<PermissionGrantDTO> permissions) {
        for (PermissionGrantDTO permDto : permissions) {
            if (permDto.getGranted() == null || !permDto.getGranted()) {
                continue;
            }

            ModuleAction moduleAction;
            if (permDto.getModuleActionId() != null) {
                moduleAction = moduleActionRepository.findById(permDto.getModuleActionId())
                        .orElseThrow(
                                () -> new RuntimeException("Module action not found: " + permDto.getModuleActionId()));
            } else if (permDto.getModuleCode() != null && permDto.getActionCode() != null) {
                moduleAction = moduleActionRepository
                        .findByModuleCodeAndCode(permDto.getModuleCode(), permDto.getActionCode())
                        .orElseThrow(() -> new RuntimeException(
                                "Module action not found: " + permDto.getModuleCode() + "." + permDto.getActionCode()));
            } else {
                continue;
            }

            RolePermission rp = RolePermission.builder()
                    .role(role)
                    .moduleAction(moduleAction)
                    .granted(true)
                    .build();
            rolePermissionRepository.save(rp);
        }
    }

    private RoleDTO toRoleDTO(Role role) {
        List<ModulePermissionDTO> modulePermissions = new ArrayList<>();

        // Group permissions by module
        Map<Long, List<RolePermission>> permsByModule = role.getPermissions().stream()
                .filter(RolePermission::getGranted)
                .collect(Collectors.groupingBy(rp -> rp.getModuleAction().getModule().getId()));

        for (Map.Entry<Long, List<RolePermission>> entry : permsByModule.entrySet()) {
            List<RolePermission> perms = entry.getValue();
            if (perms.isEmpty())
                continue;

            RbacModule module = perms.get(0).getModuleAction().getModule();
            modulePermissions.add(ModulePermissionDTO.builder()
                    .moduleId(module.getId())
                    .moduleCode(module.getCode())
                    .moduleName(module.getName())
                    .icon(module.getIcon())
                    .actions(perms.stream()
                            .map(rp -> ActionPermissionDTO.builder()
                                    .actionId(rp.getModuleAction().getId())
                                    .code(rp.getModuleAction().getCode())
                                    .name(rp.getModuleAction().getName())
                                    .granted(rp.getGranted())
                                    .build())
                            .collect(Collectors.toList()))
                    .build());
        }

        return RoleDTO.builder()
                .id(role.getId())
                .code(role.getCode())
                .name(role.getName())
                .description(role.getDescription())
                .isSystem(role.getIsSystem())
                .tenantId(role.getTenantId())
                .isActive(role.getIsActive())
                .modulePermissions(modulePermissions)
                .build();
    }

    // ========================
    // MODULE MANAGEMENT
    // ========================

    public List<ModuleDTO> getAllModules() {
        return moduleRepository.findAll().stream()
                .map(this::mapToModuleDTO)
                .collect(Collectors.toList());
    }

    public ModuleDTO getModuleById(Long id) {
        RbacModule module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found: " + id));
        return mapToModuleDTO(module);
    }

    @Transactional
    public ModuleDTO createModule(ModuleCreateDTO request) {
        if (moduleRepository.existsByCode(request.code())) {
            throw new RuntimeException("Module code already exists: " + request.code());
        }

        RbacModule module = RbacModule.builder()
                .code(request.code().toUpperCase())
                .name(request.name())
                .description(request.description())
                .icon(request.icon())
                .menuPath(request.menuPath())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .menuItems(request.menuItems())
                .isActive(true)
                .build();

        return mapToModuleDTO(moduleRepository.save(module));
    }

    @Transactional
    public ModuleDTO updateModule(Long id, ModuleCreateDTO request) {
        RbacModule module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found: " + id));

        module.setName(request.name());
        module.setDescription(request.description());
        module.setIcon(request.icon());
        module.setMenuPath(request.menuPath());
        module.setMenuItems(request.menuItems());
        if (request.displayOrder() != null) {
            module.setDisplayOrder(request.displayOrder());
        }

        return mapToModuleDTO(moduleRepository.save(module));
    }

    @Transactional
    public void deleteModule(Long id) {
        if (!moduleRepository.existsById(id)) {
            throw new RuntimeException("Module not found: " + id);
        }
        moduleRepository.deleteById(id);
    }

    private ModuleDTO mapToModuleDTO(RbacModule module) {
        return new ModuleDTO(
                module.getId(),
                module.getCode(),
                module.getName(),
                module.getDescription(),
                module.getIcon(),
                module.getMenuPath(),
                module.getDisplayOrder(),
                module.getIsActive(),
                module.getMenuItems(),
                module.getCreatedAt(),
                module.getUpdatedAt());
    }
}
