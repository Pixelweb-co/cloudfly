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
     * This replaces the static verticalMenuData.json
     */
    public List<MenuItemDTO> generateMenu(List<String> roleCodes) {
        Set<String> permissions = getPermissions(roleCodes);
        boolean isSuperAdmin = roleCodes.contains("SUPERADMIN");
        List<MenuItemDTO> menu = new ArrayList<>();

        // Dashboard - everyone with any permission gets this
        if (isSuperAdmin || !permissions.isEmpty()) {
            menu.add(MenuItemDTO.builder()
                    .label("Dashboard")
                    .href("/home")
                    .icon("tabler-smart-home")
                    .build());
        }

        // Comunicaciones (Marketing + Chatbot)
        List<MenuItemDTO> comChildren = new ArrayList<>();
        if (isSuperAdmin || hasModuleAccess(permissions, "chatbot")) {
            comChildren.add(MenuItemDTO.item("Chatbot IA WhatsApp", "/settings/chatbot", null));
            if (isSuperAdmin) {
                comChildren.add(MenuItemDTO.item("Tipos de Chatbot", "/settings/chatbot-types/list", null));
            }
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "marketing")) {
            comChildren.add(MenuItemDTO.item("Conversaciones", "/comunicaciones/conversaciones", null));
        }
        if (!comChildren.isEmpty()) {
            menu.add(MenuItemDTO.parent("Comunicaciones", "tabler-message-circle", comChildren));
        }

        // Marketing
        List<MenuItemDTO> mktChildren = new ArrayList<>();
        if (isSuperAdmin || hasModuleAccess(permissions, "marketing")) {
            mktChildren.add(MenuItemDTO.item("Campañas", "/marketing/campanas", null));
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "contacts")) {
            mktChildren.add(MenuItemDTO.item("Terceros", "/marketing/contacts/list", null));
        }
        if (!mktChildren.isEmpty()) {
            menu.add(MenuItemDTO.parent("Marketing", "tabler-speakerphone", mktChildren));
        }

        // Ventas
        List<MenuItemDTO> ventasChildren = new ArrayList<>();
        if (isSuperAdmin || hasModuleAccess(permissions, "products")) {
            ventasChildren.add(MenuItemDTO.item("Categorías", "/ventas/categorias/list", null));
            ventasChildren.add(MenuItemDTO.item("Productos", "/ventas/productos/list", null));
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "quotes")) {
            ventasChildren.add(MenuItemDTO.item("Cotizaciones", "/ventas/cotizaciones/list", null));
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "pos")) {
            ventasChildren.add(MenuItemDTO.item("Pedidos", "/ventas/pedidos", null));
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "invoices")) {
            ventasChildren.add(MenuItemDTO.item("Facturas", "/ventas/facturas/list", null));
        }
        if (!ventasChildren.isEmpty()) {
            menu.add(MenuItemDTO.parent("Ventas", "tabler-shopping-cart", ventasChildren));
        }

        // Contabilidad
        List<MenuItemDTO> contaChildren = new ArrayList<>();
        if (isSuperAdmin || hasModuleAccess(permissions, "accounting")) {
            contaChildren.add(MenuItemDTO.item("Plan de Cuentas", "/contabilidad/plan-cuentas", null));
            contaChildren.add(MenuItemDTO.item("Comprobantes", "/contabilidad/comprobantes", null));
            contaChildren.add(MenuItemDTO.item("Terceros", "/contabilidad/terceros", null));
            contaChildren.add(MenuItemDTO.item("Centros de Costo", "/contabilidad/centros-costo", null));
            contaChildren.add(MenuItemDTO.item("Balance de Prueba", "/contabilidad/balance-prueba", null));
            contaChildren.add(MenuItemDTO.item("Libro Diario", "/contabilidad/libro-diario", null));
            contaChildren.add(MenuItemDTO.item("Libro Mayor", "/contabilidad/libro-mayor", null));
            contaChildren.add(MenuItemDTO.item("Estado de Resultados", "/contabilidad/estado-resultados", null));
            contaChildren.add(MenuItemDTO.item("Balance General", "/contabilidad/balance-general", null));
        }
        if (!contaChildren.isEmpty()) {
            menu.add(MenuItemDTO.parent("Contabilidad", "tabler-calculator", contaChildren));
        }

        // Recursos Humanos / Nómina (Actualizado a NOMINA)
        List<MenuItemDTO> hrChildren = new ArrayList<>();
        if (isSuperAdmin || hasModuleAccess(permissions, "hr") || hasModuleAccess(permissions, "payroll")) {
            hrChildren.add(MenuItemDTO.item("Dashboard", "/hr/dashboard", "tabler-chart-pie"));
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "hr")) {
            hrChildren.add(MenuItemDTO.item("Empleados", "/hr/employees", "tabler-user-circle"));
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "payroll")) {
            hrChildren.add(MenuItemDTO.item("Conceptos de Nómina", "/hr/concepts", "tabler-list-details"));
            hrChildren.add(MenuItemDTO.item("Novedades", "/hr/novelties", "tabler-news"));
            hrChildren.add(MenuItemDTO.item("Periodos de Nómina", "/hr/periods", "tabler-calendar-stats"));
            hrChildren.add(MenuItemDTO.item("Recibos", "/hr/receipts", "tabler-receipt"));
        }
        if ((isSuperAdmin || hasModuleAccess(permissions, "hr") || hasModuleAccess(permissions, "payroll"))
                && (roleCodes.contains("SUPERADMIN") || roleCodes.contains("ADMIN"))) {
            hrChildren.add(MenuItemDTO.item("Configuración", "/hr/config", "tabler-settings"));
        }
        if (!hrChildren.isEmpty()) {
            menu.add(MenuItemDTO.parent("Recursos Humanos", "tabler-users", hrChildren));
        }

        // Usuarios y Roles
        List<MenuItemDTO> adminChildren = new ArrayList<>();
        if (isSuperAdmin || hasModuleAccess(permissions, "users")) {
            adminChildren.add(MenuItemDTO.item("Gestión de Usuarios", "/accounts/user/list", null));
        }
        if (isSuperAdmin || hasModuleAccess(permissions, "roles")) {
            adminChildren.add(MenuItemDTO.item("Roles y Permisos", "/settings/roles/list", null));
        }
        if (!adminChildren.isEmpty()) {
            menu.add(MenuItemDTO.parent("Usuarios y Roles", "tabler-shield-lock", adminChildren));
        }

        // Administración (solo SUPERADMIN/ADMIN)
        if (roleCodes.contains("SUPERADMIN") || roleCodes.contains("ADMIN")) {
            List<MenuItemDTO> settingsChildren = new ArrayList<>();
            if (isSuperAdmin || hasModuleAccess(permissions, "customers")) {
                settingsChildren.add(MenuItemDTO.item("Clientes", "/administracion/clientes/list", null));
            }
            if (isSuperAdmin || hasModuleAccess(permissions, "settings")) {
                settingsChildren.add(MenuItemDTO.item("Configuración General", "/settings/general", null));
            }
            if (!settingsChildren.isEmpty()) {
                menu.add(MenuItemDTO.parent("Administración", "tabler-settings", settingsChildren));
            }
        }

        // Reportes
        if (isSuperAdmin || hasModuleAccess(permissions, "reports")) {
            menu.add(MenuItemDTO.builder()
                    .label("Reportes")
                    .href("/reportes")
                    .icon("tabler-chart-bar")
                    .build());
        }

        return menu;
    }

    private boolean hasModuleAccess(Set<String> permissions, String moduleCode) {
        return permissions.stream().anyMatch(p -> p.startsWith(moduleCode + "."));
    }

    /**
     * Generate menu structure based on user roles AND tenant subscription
     * This filters the menu by both permissions and active subscription modules
     */
    public List<MenuItemDTO> generateMenu(List<String> roleCodes, Long tenantId) {
        // Get base menu from roles/permissions
        List<MenuItemDTO> baseMenu = generateMenu(roleCodes);

        // If SUPERADMIN, no subscription filtering
        if (roleCodes.contains("SUPERADMIN")) {
            return baseMenu;
        }

        // Get tenant's active subscription modules
        try {
            var subscription = subscriptionService.getActiveTenantSubscription(tenantId);
            Set<String> subscriptionModuleCodes = subscription.moduleNames().stream()
                    .map(String::toUpperCase)
                    .collect(Collectors.toSet());

            // Filter menu by subscription modules
            return filterMenuByModules(baseMenu, subscriptionModuleCodes);
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
