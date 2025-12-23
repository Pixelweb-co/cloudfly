package com.app.starter1.dto.rbac;

import lombok.*;
import java.util.List;

/**
 * Request DTO for creating/updating a role
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequestDTO {

    private String code;
    private String name;
    private String description;
    private Integer tenantId;
    private List<PermissionGrantDTO> permissions;
}
