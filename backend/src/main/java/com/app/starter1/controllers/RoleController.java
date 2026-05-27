package com.app.starter1.controllers;

import com.app.starter1.persistence.entity.PermissionEntity;
import com.app.starter1.persistence.entity.RoleEntity;
import com.app.starter1.persistence.repository.RoleRepository;
import com.app.starter1.persistence.repository.PermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    /**
     * Crear un nuevo rol con permisos
     */
    @PostMapping
    public ResponseEntity<RoleEntity> createRole(@RequestBody RoleEntity roleEntity) {
        // Validar que los permisos existan antes de asignarlos
        for (PermissionEntity permission : roleEntity.getPermissionList()) {
            if (permission.getId() != null && !permissionRepository.existsById(permission.getId())) {
                return ResponseEntity.badRequest().build();
            }
        }
        RoleEntity savedRole = roleRepository.save(roleEntity);
        return ResponseEntity.ok(savedRole);
    }

    /**
     * Obtener todos los roles con sus permisos
     */
    @GetMapping
    public ResponseEntity<List<RoleEntity>> getAllRoles() {
        List<RoleEntity> roles = (List<RoleEntity>) roleRepository.findAll();
        return ResponseEntity.ok(roles);
    }

    /**
     * Obtener un rol por su ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<RoleEntity> getRoleById(@PathVariable Long id) {
        Optional<RoleEntity> roleEntity = roleRepository.findById(id);
        return roleEntity.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Actualizar un rol con sus permisos
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoleEntity> updateRole(@PathVariable Long id, @RequestBody RoleEntity roleEntityDetails) {
        Optional<RoleEntity> roleEntityOptional = roleRepository.findById(id);

        if (roleEntityOptional.isPresent()) {
            RoleEntity roleEntity = roleEntityOptional.get();

            // Validar los permisos
            for (PermissionEntity permission : roleEntityDetails.getPermissionList()) {
                if (permission.getId() != null && !permissionRepository.existsById(permission.getId())) {
                    return ResponseEntity.badRequest().build();
                }
            }

            roleEntity.setRoleEnum(roleEntityDetails.getRoleEnum());
            roleEntity.setPermissionList(roleEntityDetails.getPermissionList());

            RoleEntity updatedRole = roleRepository.save(roleEntity);
            return ResponseEntity.ok(updatedRole);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Eliminar un rol
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        if (roleRepository.existsById(id)) {
            roleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Obtener todos los permisos disponibles
     */
    @GetMapping("/permissions")
    public ResponseEntity<List<PermissionEntity>> getAllPermissions() {
        List<PermissionEntity> permissions = (List<PermissionEntity>) permissionRepository.findAll();
        return ResponseEntity.ok(permissions);
    }
}
