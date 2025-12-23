package com.app.starter1.dto.rbac;

import lombok.*;
import java.util.List;
import java.util.Set;

/**
 * DTO for role with permissions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {

    private Long id;
    private String code;
    private String name;
    private String description;
    private Boolean isSystem;
    private Integer tenantId;
    private Boolean isActive;
    private List<ModulePermissionDTO> modulePermissions;
}
