package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactGroupDTO {
    private Map<String, List<ContactCardDTO>> groups;

    // Constructor helper
    public static ContactGroupDTO of(Map<String, List<ContactCardDTO>> groups) {
        return ContactGroupDTO.builder()
                .groups(groups)
                .build();
    }
}
