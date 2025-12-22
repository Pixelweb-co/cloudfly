package com.app.starter1.dto.menu;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MenuItemDTO {

    private String label;
    private String icon;
    private String href;
    private MenuSuffixDTO suffix;
    private List<String> excludedRoles;
    private List<MenuItemDTO> children;
}
