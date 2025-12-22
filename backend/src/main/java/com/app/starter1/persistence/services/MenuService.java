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
     */
    public List<MenuItemDTO> getMenuData() {
        // 1. Obtener usuario autenticado
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserEntity user = userRepository.findByUsername(username).orElse(null);

        // Si no hay usuario, devolver lista vacía o menú público (aquí asumimos auth)
        if (user == null) {
            log.warn("Usuario no encontrado para generar menú: {}", username);
            return new ArrayList<>();
        }

        // 2. Obtener Roles RBAC del usuario (mapeo legacy -> nuevo por ID)
        List<Long> roleIds = user.getRoles().stream().map(RoleEntity::getId).collect(Collectors.toList());
        List<Role> userRoles = rbacRoleRepository.findAllById(roleIds);

        boolean isSuperAdmin = userRoles.stream()
                .anyMatch(r -> "SUPERADMIN".equals(r.getCode()) || "ADMIN".equals(r.getCode())
                        || "MANAGER".equals(r.getCode())); // Admin y Manager también ven
        // todo por
        // compatibilidad si se
        // desea

        // 3. Obtener Módulos permitidos por Suscripción (si aplica)
        Set<Long> subscriptionModuleIds = new HashSet<>();
        boolean checkSubscription = false;

        if (!isSuperAdmin && user.getCustomer() != null) {
            checkSubscription = true;
            // Buscar suscripción activa con módulos (fetch eager idealmente, o
            // transaccional)
            Optional<Subscription> sub = subscriptionRepository
                    .findActiveTenantSubscriptionWithModules(user.getCustomer().getId());

            if (sub.isPresent()) {
                // Prioridad: Módulos custom en suscripción
                Set<RbacModule> customModules = sub.get().getModules();
                if (customModules != null && !customModules.isEmpty()) {
                    subscriptionModuleIds
                            .addAll(customModules.stream().map(RbacModule::getId).collect(Collectors.toSet()));
                } else {
                    // Fallback: Módulos del Plan
                    Set<RbacModule> planModules = sub.get().getPlan().getModules();
                    if (planModules != null) {
                        subscriptionModuleIds
                                .addAll(planModules.stream().map(RbacModule::getId).collect(Collectors.toSet()));
                    }
                }
            } else {
                // Si no tiene suscripción activa, ¿ve algo?
                // Asumamos que no ve módulos premium, lista vacía.
                // Pero dejaremos pasar módulos marcados como "is_free" o "core" si tuviéramos
                // flag.
                log.info("Usuario {} de tenant {} no tiene suscripción activa.", username, user.getCustomer().getId());
            }
        }

        // 4. Filtrar y construir menú
        List<RbacModule> allModules = moduleRepository.findAllByIsActiveTrueOrderByDisplayOrder();
        List<MenuItemDTO> menuItems = new ArrayList<>();

        for (RbacModule module : allModules) {
            // A. Filtro Suscripción
            if (checkSubscription && !subscriptionModuleIds.contains(module.getId())) {
                continue;
            }

            // B. Filtro Rol (Acceso al Módulo Padre)
            boolean hasAccess = isSuperAdmin;
            if (!hasAccess) {
                // Verificar permiso ACCESS general
                hasAccess = userRoles.stream().anyMatch(role -> role.hasPermission(module.getCode(), "ACCESS"));
            }

            if (hasAccess) {
                MenuItemDTO menuItem = convertToMenuItemDTO(module, userRoles, isSuperAdmin);
                // Si el módulo quedó sin hijos (porque se filtraron todos) y tenía hijos
                // originalmente, ¿lo mostramos?
                // Depende de si tiene enlace propio.
                if (menuItem != null) {
                    menuItems.add(menuItem);
                }
            }
        }

        return menuItems;
    }

    private MenuItemDTO convertToMenuItemDTO(RbacModule module, List<Role> userRoles, boolean isSuperAdmin) {
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

                    // Verificar acceso al subitem
                    boolean hasChildAccess = isSuperAdmin;
                    if (!hasChildAccess) {
                        String actionCode = "ACCESS_" + normalizeLabel(label);
                        hasChildAccess = userRoles.stream()
                                .anyMatch(role -> role.hasPermission(module.getCode(), actionCode));

                        // Fallback opcional: Si el usuario tiene acceso TOTAL al módulo y no
                        // granularidad específica...
                        // Pero aquí aplicamos granularidad estricta si la acción existe.
                    }

                    if (hasChildAccess) {
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
