package com.app.starter1.dto;

import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
public record AuthCreateRoleRequest(
        @Size(max = 3, message = "The user cannot more than 3 roles") List<String> roleListName

) {
}
