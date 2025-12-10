package com.app.starter1.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    private SalesStats sales;
    private CustomersStats customers;
    private InventoryStats inventory;
    private ChatbotStats chatbot;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SalesStats {
        private Double today;
        private String change;
        private String comparison;
        private String trend;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomersStats {
        private Integer active;
        private String change;
        private String comparison;
        private String trend;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryStats {
        private Integer total;
        private Integer lowStock;
        private String alert;
        private String trend;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatbotStats {
        private Integer conversations;
        private String status;
        private String lastActivity;
        private String trend;
    }
}
