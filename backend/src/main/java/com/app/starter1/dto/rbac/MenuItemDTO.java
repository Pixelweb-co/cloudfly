package com.app.starter1.dto.rbac;

import lombok.*;
import java.util.List;

/**
 * DTO for menu item - matches frontend verticalMenuData structure
 */
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
    private String moduleCode; // Código del módulo para identificación en frontend

    // Static factory methods for common menu items
    public static MenuItemDTO section(String title) {
        return MenuItemDTO.builder()
                .isSection(true)
                .sectionTitle(title)
                .build();
    }

    public static MenuItemDTO item(String label, String href, String icon) {
        return MenuItemDTO.builder()
                .label(label)
                .href(href)
                .icon(icon)
                .build();
    }

    public static MenuItemDTO parent(String label, String icon, List<MenuItemDTO> children) {
        return MenuItemDTO.builder()
                .label(label)
                .icon(icon)
                .children(children)
                .build();
    }
}
