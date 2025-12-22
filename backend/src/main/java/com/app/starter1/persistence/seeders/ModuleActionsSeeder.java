package com.app.starter1.persistence.seeders;

import com.app.starter1.persistence.entity.rbac.ModuleAction;
import com.app.starter1.persistence.entity.rbac.RbacModule;
import com.app.starter1.persistence.repository.rbac.ModuleActionRepository;
import com.app.starter1.persistence.repository.rbac.RbacModuleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class ModuleActionsSeeder implements CommandLineRunner {

    private final RbacModuleRepository moduleRepository;
    private final ModuleActionRepository actionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<String> STANDARD_ACTIONS = Arrays.asList("ACCESS", "CREATE", "UPDATE", "DELETE");

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Iniciando seed de acciones de módulos...");
        List<RbacModule> modules = moduleRepository.findAll();

        if (modules.isEmpty()) {
            log.warn("No se encontraron módulos para asignar acciones. Asegúrate de ejecutar ModulesSeeder primero.");
            return;
        }

        for (RbacModule module : modules) {
            // Acciones Estándar
            for (String actionCode : STANDARD_ACTIONS) {
                createActionIfNotExists(module, actionCode, null);
            }

            // Acciones por Subítem de Menú (Parsear JSON)
            if (module.getMenuItems() != null && !module.getMenuItems().isEmpty()) {
                try {
                    JsonNode root = objectMapper.readTree(module.getMenuItems());
                    if (root.isArray()) {
                        for (JsonNode item : root) {
                            if (item.has("label")) {
                                String label = item.get("label").asText();
                                // Crear código ACCESS_NOMBRE_SUBITEM
                                String cleanLabel = label.toUpperCase()
                                        .replace("Á", "A")
                                        .replace("É", "E")
                                        .replace("Í", "I")
                                        .replace("Ó", "O")
                                        .replace("Ú", "U")
                                        .replace("Ñ", "N")
                                        .replaceAll("[^A-Z0-9]", "_")
                                        .replaceAll("_+", "_"); // Evitar __

                                if (cleanLabel.endsWith("_"))
                                    cleanLabel = cleanLabel.substring(0, cleanLabel.length() - 1);
                                if (cleanLabel.startsWith("_"))
                                    cleanLabel = cleanLabel.substring(1);

                                String subActionCode = "ACCESS_" + cleanLabel;
                                createActionIfNotExists(module, subActionCode, "Ver " + label);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Error parsing menu items for module " + module.getCode(), e);
                }
            }
        }
        log.info("Acciones de módulos sembradas correctamente.");
    }

    private void createActionIfNotExists(RbacModule module, String actionCode, String customName) {
        Optional<ModuleAction> existingAction = actionRepository.findByModuleCodeAndCode(module.getCode(), actionCode);

        if (existingAction.isEmpty()) {
            String name = (customName != null) ? customName : getActionName(actionCode);
            String description = (customName != null) ? customName
                    : ("Permiso para " + getActionDescription(actionCode) + " en " + module.getName());

            ModuleAction action = ModuleAction.builder()
                    .module(module)
                    .code(actionCode)
                    .name(name)
                    .description(description)
                    .build();

            actionRepository.save(action);
            log.debug("Creada acción {} para módulo {}", actionCode, module.getName());
        }
    }

    private String getActionName(String code) {
        switch (code) {
            case "ACCESS":
                return "Acceso General";
            case "CREATE":
                return "Crear";
            case "UPDATE":
                return "Editar";
            case "DELETE":
                return "Eliminar";
            default:
                return code;
        }
    }

    private String getActionDescription(String code) {
        switch (code) {
            case "ACCESS":
                return "ver el módulo y su contenido";
            case "CREATE":
                return "crear nuevos registros";
            case "UPDATE":
                return "modificar registros existentes";
            case "DELETE":
                return "eliminar registros";
            default:
                return "realizar acción " + code;
        }
    }
}
