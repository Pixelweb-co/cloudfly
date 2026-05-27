package com.app.starter1.dto.rbac;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ModuleCreateDTO(
                @NotBlank(message = "Code is required") @Size(max = 50) String code,

                @NotBlank(message = "Name is required") @Size(max = 100) String name,

                @Size(max = 255) String description,

                @Size(max = 50) String icon,

                String menuPath,
                Integer displayOrder,
                String menuItems) {
}
