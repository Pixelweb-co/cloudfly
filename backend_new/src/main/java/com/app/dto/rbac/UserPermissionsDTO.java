package com.app.dto.rbac;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionsDTO {
    private Long userId;
    private String username;
    private List<String> roles;
    private Set<String> permissions;
    private List<String> modules;
    private List<MenuItemDTO> menu;
}
