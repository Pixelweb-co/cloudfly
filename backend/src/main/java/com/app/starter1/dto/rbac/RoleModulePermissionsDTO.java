package com.app.starter1.dto.rbac;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleModulePermissionsDTO {
    private Long moduleId;
    private String moduleCode;
    private String moduleName;
    private List<RoleActionDTO> actions;
}
