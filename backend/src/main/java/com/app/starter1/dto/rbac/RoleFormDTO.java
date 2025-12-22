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
public class RoleFormDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    private List<RoleModulePermissionsDTO> modules;
}
