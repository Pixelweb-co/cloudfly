package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO {
    // Basic Metrics
    private Double totalRevenue;
    private Double revenueChange;
    private Integer totalOrders;
    private Double ordersChange;
    private Integer totalCustomers;
    private Double customersChange;
    private Integer totalProducts;
    private Double productsChange;

    private Integer totalInvoices;
    private Double invoicesChange;
    private Integer pendingQuotes;
    private Integer lowStockProducts;

    private Integer totalEmployees;
    private Double employeesChange;
    private Double totalPayroll;

    private Integer activeConversations;
    private Double messagesChange;
}
