package com.app.starter1.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopProductDTO {
    private String id;
    private String name;
    private Integer sales;
    private String trend;
}
