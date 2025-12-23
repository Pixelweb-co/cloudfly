package com.app.starter1.dto.rbac;

import lombok.*;
import java.util.List;
import java.util.Set;

/**
 * DTO for module with its permissions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModulePermissionDTO {

    private Long moduleId;
    private String moduleCode;
    private String moduleName;
    private String icon;
    private List<ActionPermissionDTO> actions;
}
