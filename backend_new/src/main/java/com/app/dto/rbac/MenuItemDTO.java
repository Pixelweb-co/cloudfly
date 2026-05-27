package com.app.dto.rbac;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemDTO {
    private String label;
    private String href;
    private String icon;
    private String prefix;
    private String suffix;
    private Boolean disabled;
    private Boolean exactMatch;
    private String activeUrl;
    private Boolean excludeLang;
    private List<MenuItemDTO> children;
    private Boolean isSection;
    private String sectionTitle;
    private String moduleCode;
}
