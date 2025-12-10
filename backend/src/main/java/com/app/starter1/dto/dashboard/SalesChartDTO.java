package com.app.starter1.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SalesChartDTO {
    private String period;
    private List<DataPoint> data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        private String date;
        private Double ventas;
        private Integer ordenes;
    }
}
