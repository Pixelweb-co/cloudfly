package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceAvailabilityDto {
    private Long serviceId;
    private String serviceName;
    private boolean noSchedule;
    private List<ProviderAvailability> providers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderAvailability {
        private Long userId;
        private String providerName;
        private List<SlotSummary> availableSlots;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlotSummary {
        private Long id;
        private String start;
        private String end;
    }
}
