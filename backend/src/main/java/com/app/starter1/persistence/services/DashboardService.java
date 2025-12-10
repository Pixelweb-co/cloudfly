package com.app.starter1.persistence.services;

import com.app.starter1.dto.dashboard.*;
import com.app.starter1.persistence.entity.Order;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.OrderRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private final OrderRepository orderRepository;
        private final ProductRepository productRepository;
        private final CustomerRepository customerRepository;

        public DashboardStatsDTO getStats() {
                // Ventas de hoy
                LocalDate today = LocalDate.now();
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();

                List<Order> todayOrders = orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
                Double todaySales = todayOrders.stream()
                                .map(Order::getTotal)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .doubleValue();

                // Ventas de ayer para comparación
                LocalDateTime startOfYesterday = today.minusDays(1).atStartOfDay();
                List<Order> yesterdayOrders = orderRepository.findByCreatedAtBetween(startOfYesterday, startOfDay);
                Double yesterdaySales = yesterdayOrders.stream()
                                .map(Order::getTotal)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .doubleValue();

                Double salesChange = yesterdaySales > 0
                                ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
                                : 0.0;

                DashboardStatsDTO.SalesStats salesStats = new DashboardStatsDTO.SalesStats(
                                todaySales,
                                String.format("%+.0f%%", salesChange),
                                "vs ayer",
                                salesChange > 0 ? "up" : salesChange < 0 ? "down" : "neutral");

                // Clientes activos (últimos 7 días)
                LocalDate weekAgo = LocalDate.now().minusDays(7);
                Long activeCustomers = customerRepository.countByDateRegisterAfter(weekAgo);

                DashboardStatsDTO.CustomersStats customersStats = new DashboardStatsDTO.CustomersStats(
                                activeCustomers.intValue(),
                                "+8%",
                                "esta semana",
                                "up");

                // Inventario
                Long totalProducts = productRepository.count();
                List<Product> lowStockProducts = productRepository.findByInventoryQtyLessThan(10);

                DashboardStatsDTO.InventoryStats inventoryStats = new DashboardStatsDTO.InventoryStats(
                                totalProducts.intValue(),
                                lowStockProducts.size(),
                                lowStockProducts.size() + " productos con stock bajo",
                                lowStockProducts.isEmpty() ? "neutral" : "down");

                // Chatbot (datos simulados - TODO: conectar con sistema real de chat)
                DashboardStatsDTO.ChatbotStats chatbotStats = new DashboardStatsDTO.ChatbotStats(
                                12,
                                "Activo ✓",
                                "Hace 2 min",
                                "up");

                return new DashboardStatsDTO(salesStats, customersStats, inventoryStats, chatbotStats);
        }

        public SalesChartDTO getSalesChart(String period) {
                List<SalesChartDTO.DataPoint> dataPoints = new ArrayList<>();
                LocalDateTime now = LocalDateTime.now();

                switch (period) {
                        case "7d":
                                for (int i = 6; i >= 0; i--) {
                                        LocalDate date = LocalDate.now().minusDays(i);
                                        LocalDateTime start = date.atStartOfDay();
                                        LocalDateTime end = date.plusDays(1).atStartOfDay();

                                        List<Order> orders = orderRepository.findByCreatedAtBetween(start, end);
                                        Double sales = orders.stream()
                                                        .map(Order::getTotal)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                        .doubleValue();

                                        String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT,
                                                        new Locale("es", "ES"));
                                        dataPoints.add(new SalesChartDTO.DataPoint(dayName, sales, orders.size()));
                                }
                                break;

                        case "30d":
                                for (int week = 3; week >= 0; week--) {
                                        LocalDateTime weekStart = now.minusWeeks(week + 1);
                                        LocalDateTime weekEnd = now.minusWeeks(week);

                                        List<Order> orders = orderRepository.findByCreatedAtBetween(weekStart, weekEnd);
                                        Double sales = orders.stream()
                                                        .map(Order::getTotal)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                        .doubleValue();

                                        dataPoints.add(new SalesChartDTO.DataPoint("Sem " + (4 - week), sales,
                                                        orders.size()));
                                }
                                break;

                        case "year":
                                for (int month = 11; month >= 0; month--) {
                                        LocalDateTime monthStart = now.minusMonths(month).withDayOfMonth(1)
                                                        .toLocalDate().atStartOfDay();
                                        LocalDateTime monthEnd = monthStart.plusMonths(1);

                                        List<Order> orders = orderRepository.findByCreatedAtBetween(monthStart,
                                                        monthEnd);
                                        Double sales = orders.stream()
                                                        .map(Order::getTotal)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                                                        .doubleValue();

                                        String monthName = monthStart.getMonth().getDisplayName(TextStyle.SHORT,
                                                        new Locale("es", "ES"));
                                        dataPoints.add(new SalesChartDTO.DataPoint(monthName, sales, orders.size()));
                                }
                                break;
                }

                return new SalesChartDTO(period, dataPoints);
        }

        public List<ActivityDTO> getRecentActivity(Integer limit) {
                List<ActivityDTO> activities = new ArrayList<>();

                // Obtener últimas órdenes
                List<Order> recentOrders = orderRepository.findTop5ByOrderByCreatedAtDesc();

                for (Order order : recentOrders) {
                        activities.add(new ActivityDTO(
                                        order.getId().toString(),
                                        "venta",
                                        "Venta #" + order.getId() + " completada",
                                        "$" + String.format("%.2f", order.getTotal()),
                                        order.getCreatedAt(),
                                        "/orders/" + order.getId()));
                }

                // TODO: Agregar otros tipos de actividad (clientes, chatbot, inventario,
                // cotizaciones)

                // Ordenar por timestamp descendente y limitar
                return activities.stream()
                                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                                .limit(limit != null ? limit : 5)
                                .collect(Collectors.toList());
        }

        public List<TopProductDTO> getTopProducts(String period) {
                // TODO: Implementar con query real basada en OrderItems
                // Por ahora, retornar productos con más stock como placeholder
                List<Product> topProducts = productRepository.findTop5ByOrderByInventoryQtyDesc();

                return topProducts.stream()
                                .map(product -> new TopProductDTO(
                                                product.getId().toString(),
                                                product.getProductName(),
                                                product.getInventoryQty() != null ? product.getInventoryQty() : 0, // Placeholder:
                                                                                                                   // usar
                                                                                                                   // ventas
                                                                                                                   // reales
                                                "up"))
                                .collect(Collectors.toList());
        }
}
