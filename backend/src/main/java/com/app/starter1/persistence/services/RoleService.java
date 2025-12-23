package com.app.starter1.persistence.services;

import com.app.starter1.dto.rbac.RoleActionDTO;
import com.app.starter1.dto.rbac.RoleFormDTO;
import com.app.starter1.dto.rbac.RoleModulePermissionsDTO;
import com.app.starter1.persistence.entity.rbac.*;
import com.app.starter1.persistence.repository.rbac.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RbacRoleRepository roleRepository;
    private final RbacModuleRepository moduleRepository;
    private final ModuleActionRepository actionRepository;
    private final RolePermissionRepository permissionRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public RoleFormDTO getRoleForEdit(Long roleId) {
        Role role = roleId != null
                ? roleRepository.findById(roleId).orElseThrow(() -> new RuntimeException("Role not found"))
                : new Role();

        List<RbacModule> allModules = moduleRepository.findAll();
        List<RoleModulePermissionsDTO> modulePermissions = new ArrayList<>();

        for (RbacModule module : allModules) {
            // Obtener todas las acciones posibles para este módulo
            List<ModuleAction> actions = actionRepository.findByModuleId(module.getId());

            List<RoleActionDTO> actionDTOs = actions.stream().map(action -> {
                boolean granted = false;
                if (role.getId() != null) {
                    granted = role.hasPermission(module.getCode(), action.getCode());
                }

                return RoleActionDTO.builder()
                        .id(action.getId())
                        .code(action.getCode())
                        .name(action.getName())
                        .description(action.getDescription())
                        .granted(granted)
                        .build();
            }).collect(Collectors.toList());

            modulePermissions.add(RoleModulePermissionsDTO.builder()
                    .moduleId(module.getId())
                    .moduleCode(module.getCode())
                    .moduleName(module.getName())
                    .actions(actionDTOs)
                    .build());
        }

        return RoleFormDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .code(role.getCode())
                .description(role.getDescription())
                .modules(modulePermissions)
                .build();
    }

    @Transactional(readOnly = true)
    public RoleFormDTO getEmptyRoleForm() {
        return getRoleForEdit(null);
    }

    @Transactional
    public Role saveRole(RoleFormDTO formDTO) {
        Role role;
        if (formDTO.getId() != null) {
            role = roleRepository.findById(formDTO.getId())
                    .orElseThrow(() -> new RuntimeException("Role not found"));

            // Limpiar permisos existentes para re-crearlos (o actualizarlos)
            // Estrategia simple: eliminar todos y volver a insertar los seleccionados
            // Ojo: orphanRemoval=true en la entidad debería manejar esto si limpiamos la
            // colección
            role.getPermissions().clear();

            // CRITICAL: Flush to ensure deletions are committed to DB before new inserts
            // This prevents duplicate key violations on the unique constraint (role_id,
            // module_action_id)
            entityManager.flush();
        } else {
            role = new Role();
            role.setCode(formDTO.getName().toUpperCase().replace(" ", "_")); // Generar código simple
        }

        role.setName(formDTO.getName());
        role.setDescription(formDTO.getDescription());
        // role.setCode(...) si se permite editar, cuidado con duplicados

        final Role savedRole = roleRepository.save(role); // Guardar para tener ID si es nuevo

        // Procesar permisos
        if (formDTO.getModules() != null) {
            for (RoleModulePermissionsDTO moduleDTO : formDTO.getModules()) {
                if (moduleDTO.getActions() != null) {
                    for (RoleActionDTO actionDTO : moduleDTO.getActions()) {
                        if (Boolean.TRUE.equals(actionDTO.getGranted())) {
                            ModuleAction moduleAction = actionRepository.findById(actionDTO.getId())
                                    .orElseThrow(() -> new RuntimeException("Action not found: " + actionDTO.getId()));

                            RolePermission permission = RolePermission.builder()
                                    .role(savedRole)
                                    .moduleAction(moduleAction)
                                    .granted(true)
                                    .build();

                            savedRole.getPermissions().add(permission);
                        }
                    }
                }
            }
        }

        return roleRepository.save(savedRole);
    }

    @Transactional
    public void deleteRole(Long id) {
        roleRepository.deleteById(id);
    }
}
