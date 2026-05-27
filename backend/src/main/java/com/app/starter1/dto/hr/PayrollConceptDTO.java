package com.app.starter1.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollConceptDTO {
    private Long id;
    private String conceptType;
    private String code;
    private String name;
    private String description;
    private String satCode;
    private Boolean isTaxable;
    private Boolean isImssSubject;
    private String calculationFormula;
    private Boolean isSystemConcept;
    private Boolean isActive;
}
