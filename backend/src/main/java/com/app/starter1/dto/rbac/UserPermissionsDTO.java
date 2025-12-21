package com.app.starter1.dto.rbac;

import lombok.*;
import java.util.List;
import java.util.Set;

/**
 * DTO for user permissions response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionsDTO {

    private Long userId;
    private String username;
    private List<String> roles;
    private Set<String> permissions; // Format: "module.action" e.g., "pos.read", "accounting.create"
    private List<String> modules; // Modules the user has access to
    private List<MenuItemDTO> menu; // Full menu structure for the user
}
