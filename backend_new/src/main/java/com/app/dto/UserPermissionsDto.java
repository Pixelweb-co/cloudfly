package com.app.dto;

import lombok.*;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionsDto {
    private Long userId;
    private String username;
    private List<String> roles;
    private Set<String> permissions;
    private List<String> modules;
    private List<MenuItemDto> menu;
}
