package com.app.starter1.dto.rbac;

import lombok.*;

/**
 * DTO for action permission status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionPermissionDTO {

    private Long actionId;
    private String code;
    private String name;
    private Boolean granted;
}
