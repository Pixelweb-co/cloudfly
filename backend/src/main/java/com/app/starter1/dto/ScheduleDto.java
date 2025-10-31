    package com.app.starter1.dto;

    import lombok.AllArgsConstructor;
    import lombok.Builder;
    import lombok.Data;
    import lombok.NoArgsConstructor;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public class ScheduleDto {
        private Long scheduleId;
        private String productName;
        private String brand;
        private String licencePlate;
        private String model;
        private String contractNumber;
        private String customerName;
        private String status;
        private String startDate;
        private String endDate;
    }
