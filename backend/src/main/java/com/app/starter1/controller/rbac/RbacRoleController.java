package com.app.starter1.controller.rbac;

import com.app.starter1.dto.rbac.RoleFormDTO;
import com.app.starter1.persistence.entity.rbac.Role;
import com.app.starter1.persistence.services.RoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RbacRoleController {

    private final RoleService roleService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    @GetMapping("/form/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<RoleFormDTO> getRoleForm(@PathVariable String id) {
        if ("new".equals(id)) {
            return ResponseEntity.ok(roleService.getEmptyRoleForm());
        }
        return ResponseEntity.ok(roleService.getRoleForEdit(Long.parseLong(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<Role> saveRole(@RequestBody RoleFormDTO roleForm) {
        return ResponseEntity.ok(roleService.saveRole(roleForm));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
}
