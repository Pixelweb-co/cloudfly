package com.app.services;

import com.app.dto.rbac.MenuItemDTO;
import com.app.persistence.repository.ModuleRepository;
import com.app.persistence.repository.SubscriptionRepository;
import com.app.persistence.repository.SubscriptionModuleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RbacService {

    private final ModuleRepository moduleRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionModuleRepository subscriptionModuleRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Mono<List<MenuItemDTO>> generateMenuForRoles(List<String> roles, Long customerId) {
        boolean isManager = roles != null && roles.contains("MANAGER");

        Flux<com.app.persistence.entity.ModuleEntity> accessibleModules;

        if (isManager) {
            log.info("Generating menu for MANAGER. Returning all active modules.");
            accessibleModules = moduleRepository.findAll()
                    .filter(m -> m.getIsActive() != null && m.getIsActive());
        } else {
            log.info("Generating menu for Admin/User. Filtering by subscription for customerId: {}", customerId);
            if (customerId == null) {
                accessibleModules = Flux.empty();
            } else {
                accessibleModules = subscriptionRepository.findFirstByCustomerIdAndStatusOrderByEndDateDesc(customerId, "active")
                        .flatMapMany(subscription -> subscriptionModuleRepository.findBySubscriptionId(subscription.getId()))
                        .map(com.app.persistence.entity.SubscriptionModuleEntity::getModuleId)
                        .collectList()
                        .flatMapMany(moduleIds -> moduleRepository.findAllById(moduleIds))
                        .filter(m -> m.getIsActive() != null && m.getIsActive());
            }
        }

        return accessibleModules
                .sort(Comparator.comparingInt(m -> m.getDisplayOrder() != null ? m.getDisplayOrder() : 0))
                .map(module -> {
                    List<MenuItemDTO> children = parseMenuItems(module.getMenuItems());
                    return MenuItemDTO.builder()
                            .label(module.getName())
                            .icon(module.getIcon())
                            .href(module.getMenuPath())
                            .moduleCode(module.getCode())
                            .children(children.isEmpty() ? null : children)
                            .build();
                })
                .collectList()
                .map(modules -> {
                    List<MenuItemDTO> menu = new ArrayList<>();
                    // El botón Dashboard base
                    menu.add(MenuItemDTO.builder()
                            .label("Dashboard")
                            .href("/home")
                            .icon("tabler-smart-home")
                            .build());
                    menu.addAll(modules);
                    return menu;
                });
    }

    private List<MenuItemDTO> parseMenuItems(String menuItemsJson) {
        if (menuItemsJson == null || menuItemsJson.trim().isEmpty()) {
            return List.of();
        }
        try {
            List<Map<String, Object>> items = objectMapper.readValue(menuItemsJson, new TypeReference<List<Map<String, Object>>>() {});
            return items.stream()
                    .map(item -> MenuItemDTO.builder()
                            .label((String) item.get("label"))
                            .href((String) item.get("href"))
                            .icon((String) item.getOrDefault("icon", null))
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Failed to parse menu items JSON: {}", menuItemsJson, e);
            return List.of();
        }
    }
}
