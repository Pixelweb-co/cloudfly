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
    private String location;
    private Integer limit;
    private String source;
    private Boolean enrich;
}
