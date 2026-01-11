package com.app.starter1.persistence.services;

import com.app.starter1.dto.menu.MenuItemDTO;
import com.app.starter1.dto.menu.MenuSuffixDTO;
import com.app.starter1.persistence.entity.Subscription;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.entity.RoleEntity;
import com.app.starter1.persistence.entity.rbac.RbacModule;
import com.app.starter1.persistence.entity.rbac.Role;
import com.app.starter1.persistence.repository.SubscriptionRepository;
import com.app.starter1.persistence.repository.UserRepository;
import com.app.starter1.persistence.repository.rbac.RbacModuleRepository;
import com.app.starter1.persistence.repository.rbac.RbacRoleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MenuService {

    private final RbacModuleRepository moduleRepository;
    private final RbacRoleRepository rbacRoleRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Obtiene el menú del sistema filtrado por Suscripción (Tenant) y Permisos
     * (Rol)
     * 
     * Flujo:
     * - SUPERADMIN y MANAGER: Ven TODOS los módulos sin restricciones (no requieren
     * suscripción)
     * - Otros roles (ADMIN, USER, etc.):
     * 1. Obtener la suscripción del customer al que pertenece el usuario
     * 2. Obtener los módulos asociados a la suscripción
     * 3. Filtrar los módulos de la suscripción si el rol tiene acceso a ellos
     * 4. Devolver en formato MenuItemDTO para renderizar en el frontend
     */
    @Transactional(readOnly = true)
    public List<MenuItemDTO> getMenuData() {
        // 1. Obtener usuario autenticado
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            log.warn("Usuario no encontrado para generar menú: {}", username);
            return new ArrayList<>();
        }

        // Obtener roles RBAC del usuario (necesarios para filtrado posterior)
        List<Long> roleIds = user.getRoles().stream().map(RoleEntity::getId).collect(Collectors.toList());
        List<Role> userRoles = rbacRoleRepository.findAllById(roleIds);

        // Identificar si es un rol de SISTEMA (MANAGER, SUPERADMIN) con acceso total
        // multi-tenant
        // ADMIN es un rol de TENANT controlado por permisos en base de datos
        boolean isSystemRole = userRoles.stream()
                .anyMatch(r -> "MANAGER".equals(r.getCode()) ||
                        "SUPERADMIN".equals(r.getCode()));

        // ============================================================
        // MANAGER/SUPERADMIN: Acceso total a todos los módulos (roles de sistema
        // multi-tenant)
        // ============================================================
        if (isSystemRole) {
            log.info("Usuario {} tiene rol de SISTEMA - Acceso total multi-tenant", username);

            List<RbacModule> allModules = moduleRepository.findAllByIsActiveTrueOrderByDisplayOrder();
            List<MenuItemDTO> menuItems = new ArrayList<>();

            for (RbacModule module : allModules) {
                MenuItemDTO menuItem = convertToMenuItemDTO(module, userRoles, true); // true = ver todos los sub-items
                if (menuItem != null) {
                    menuItems.add(menuItem);
                }
            }

            log.info("Rol de sistema {} generó menú con {} items (todos los módulos activos)",
                    username, menuItems.size());
            return menuItems;
        }

        // ============================================================
        // Otros Roles (ADMIN, USER, etc.): Filtro de suscripción
        // ============================================================

        // 3. PASO 1: Obtener suscripción del customer (OBLIGATORIO para roles
        // no-sistema)
        if (user.getCustomer() == null) {
            log.warn("Usuario {} no tiene customer asociado. No se puede generar menú.", username);
            return new ArrayList<>();
        }

        Optional<Subscription> subscriptionOpt = subscriptionRepository
                .findActiveTenantSubscriptionWithModules(user.getCustomer().getId());

        if (!subscriptionOpt.isPresent()) {
            log.info("Customer {} no tiene suscripción activa. Usuario {} no verá módulos.",
                    user.getCustomer().getId(), username);
            return new ArrayList<>();
        }

        Subscription subscription = subscriptionOpt.get();

        // 4. PASO 2: Obtener módulos asociados a la suscripción
        Set<Long> subscriptionModuleIds = new HashSet<>();
        Set<RbacModule> customModules = subscription.getModules();

        if (customModules != null && !customModules.isEmpty()) {
            // Prioridad: Módulos custom configurados en la suscripción
            subscriptionModuleIds.addAll(customModules.stream()
                    .map(RbacModule::getId)
                    .collect(Collectors.toSet()));
            log.debug("Usuario {} tiene {} módulos custom en suscripción", username, customModules.size());
        } else {
            // Fallback: Módulos del Plan asociado a la suscripción
            Set<RbacModule> planModules = subscription.getPlan().getModules();
            if (planModules != null && !planModules.isEmpty()) {
                subscriptionModuleIds.addAll(planModules.stream()
                        .map(RbacModule::getId)
                        .collect(Collectors.toSet()));
                log.debug("Usuario {} tiene {} módulos del plan", username, planModules.size());
            } else {
                log.warn("Suscripción {} no tiene módulos configurados ni en custom ni en plan",
                        subscription.getId());
                return new ArrayList<>();
            }
        }

        // 5. PASO 3: Filtrar módulos por suscripción Y por permisos del rol
        List<RbacModule> allModules = moduleRepository.findAllByIsActiveTrueOrderByDisplayOrder();
        List<MenuItemDTO> menuItems = new ArrayList<>();

        for (RbacModule module : allModules) {
            // Filtro 1: El módulo DEBE estar en la suscripción
            if (!subscriptionModuleIds.contains(module.getId())) {
                log.trace("Módulo {} no está en suscripción de usuario {}", module.getCode(), username);
                continue;
            }

            // Filtro 2: El rol del usuario DEBE tener permiso ACCESS al módulo
            boolean hasAccess = userRoles.stream()
                    .anyMatch(role -> role.hasPermission(module.getCode(), "ACCESS"));

            if (!hasAccess) {
                log.trace("Usuario {} no tiene permiso ACCESS al módulo {}", username, module.getCode());
                continue;
            }

            // Convertir el módulo a MenuItemDTO (con filtrado de sub-items)
            MenuItemDTO menuItem = convertToMenuItemDTO(module, userRoles, false); // false = filtrar sub-items por
                                                                                   // permisos

            if (menuItem != null) {
                menuItems.add(menuItem);
            }
        }

        log.info("Usuario {} generó menú con {} items (filtrado por suscripción y roles)",
                username, menuItems.size());
        return menuItems;
    }

    private MenuItemDTO convertToMenuItemDTO(RbacModule module, List<Role> userRoles, boolean showAllSubItems) {
        try {
            MenuItemDTO menuItem = MenuItemDTO.builder()
                    .label(module.getName())
                    .icon(module.getIcon())
                    .href(module.getMenuPath())
                    .build();

            // Parse menuItems JSON to children y filtrar
            if (module.getMenuItems() != null && !module.getMenuItems().isEmpty()) {
                List<Map<String, Object>> childrenData = objectMapper.readValue(
                        module.getMenuItems(),
                        new TypeReference<List<Map<String, Object>>>() {
                        });

                List<MenuItemDTO> children = new ArrayList<>();
                for (Map<String, Object> childData : childrenData) {
                    String label = (String) childData.get("label");

                    // Si showAllSubItems es true (MANAGER), mostrar todos los sub-items sin filtrar
                    // Si es false, verificar permisos explícitos
                    boolean hasChildAccess = showAllSubItems;

                    if (!hasChildAccess) {
                        // Verificar acceso al subitem - usuarios normales necesitan permiso explícito
                        String actionCode = "ACCESS_" + normalizeLabel(label);
                        hasChildAccess = userRoles.stream()
                                .anyMatch(role -> role.hasPermission(module.getCode(), actionCode));

                        if (!hasChildAccess) {
                            log.trace("Usuario no tiene permiso {} para sub-item '{}' del módulo {}",
                                    actionCode, label, module.getCode());
                            continue;
                        }
                    }

                    // Usuario tiene acceso al sub-item
                    MenuItemDTO child = MenuItemDTO.builder()
                            .label(label)
                            .href((String) childData.get("href"))
                            .icon((String) childData.get("icon"))
                            .build();

                    if (childData.containsKey("suffix")) {
                        @SuppressWarnings("unchecked")
                        Map<String, String> suffixData = (Map<String, String>) childData.get("suffix");
                        MenuSuffixDTO suffix = MenuSuffixDTO.builder()
                                .label(suffixData.get("label"))
                                .color(suffixData.get("color"))
                                .build();
                        child.setSuffix(suffix);
                    }
                    children.add(child);
                }
                menuItem.setChildren(children);
            }

            // Extras (badges, etc)
            if ("COMUNICACIONES".equals(module.getCode())) {
                menuItem.setSuffix(MenuSuffixDTO.builder().label("New").color("info").build());
            }

            return menuItem;
        } catch (Exception e) {
            log.error("Error converting module {} to menu item: {}", module.getCode(), e.getMessage());
            return null;
        }
    }

    private String normalizeLabel(String label) {
        if (label == null)
            return "";
        String cleanLabel = label.toUpperCase()
                .replace("Á", "A")
                .replace("É", "E")
                .replace("Í", "I")
                .replace("Ó", "O")
                .replace("Ú", "U")
                .replace("Ñ", "N")
                .replaceAll("[^A-Z0-9]", "_")
                .replaceAll("_+", "_");

        if (cleanLabel.endsWith("_"))
            cleanLabel = cleanLabel.substring(0, cleanLabel.length() - 1);
        if (cleanLabel.startsWith("_"))
            cleanLabel = cleanLabel.substring(1);
        return cleanLabel;
    }
}
