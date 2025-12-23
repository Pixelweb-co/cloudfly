package com.app.starter1.dto.rbac;

import lombok.*;

/**
 * DTO for granting/revoking a permission
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionGrantDTO {

    private Long moduleActionId;
    private String moduleCode;
    private String actionCode;
    private Boolean granted;
}
