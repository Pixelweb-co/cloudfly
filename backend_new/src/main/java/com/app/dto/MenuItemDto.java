package com.app.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemDto {
    private String label;
    private String href;
    private String icon;
    private String prefix;
    private String suffix;
    private Boolean disabled;
    private Boolean exactMatch;
    private String activeUrl;
    private Boolean excludeLang;
    private List<MenuItemDto> children;
    private Boolean isSection;
    private String sectionTitle;
    private String moduleCode;
    private Integer displayOrder;
}
