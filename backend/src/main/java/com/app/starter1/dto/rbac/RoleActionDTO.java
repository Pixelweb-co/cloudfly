package com.app.starter1.dto.rbac;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleActionDTO {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Boolean granted; // True si el rol tiene este permiso asignado
}
