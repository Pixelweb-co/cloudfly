package com.app.dto.leads;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadFilter {
    private String keyword;
    private String country;
    private String state;
    private String city;
    private Integer limit;
    private String source;
    private Boolean enrich;
}
