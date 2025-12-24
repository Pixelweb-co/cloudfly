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
                // Fecha actual y rangos
                LocalDate today = LocalDate.now();
                LocalDateTime startOfDay = today.atStartOfDay();
                LocalDateTime endOfDay = today.plusDays(1).atStartOfDay();
                LocalDate firstDayOfMonth = today.withDayOfMonth(1);
                LocalDate firstDayOfLastMonth = firstDayOfMonth.minusMonths(1);
                LocalDateTime startOfMonth = firstDayOfMonth.atStartOfDay();
                LocalDateTime startOfLastMonth = firstDayOfLastMonth.atStartOfDay();

                // ===== SALES MODULE =====
                // Ventas del mes actual
                List<Order> monthOrders = orderRepository.findByCreatedAtBetween(startOfMonth, endOfDay);
                Double totalRevenue = monthOrders.stream()
                                .map(Order::getTotal)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .doubleValue();

                // Ventas del mes anterior para comparación
                List<Order> lastMonthOrders = orderRepository.findByCreatedAtBetween(startOfLastMonth, startOfMonth);
                Double lastMonthRevenue = lastMonthOrders.stream()
                                .map(Order::getTotal)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .doubleValue();

                Double revenueChange = lastMonthRevenue > 0
                                ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
                                : 0.0;

                // Total de pedidos del mes
                Integer totalOrders = monthOrders.size();
                Integer lastMonthOrdersCount = lastMonthOrders.size();
                Double ordersChange = lastMonthOrdersCount > 0
                                ? ((double) (totalOrders - lastMonthOrdersCount) / lastMonthOrdersCount) * 100
                                : 0.0;

                // Total de clientes
                Long totalCustomers = customerRepository.count();
                LocalDate lastWeek = today.minusDays(7);
                Long newCustomersThisWeek = customerRepository.countByDateRegisterAfter(lastWeek);
                Double customersChange = totalCustomers > 0
                                ? ((double) newCustomersThisWeek / totalCustomers) * 100
                                : 0.0;

                // Total de productos
                Long totalProducts = productRepository.count();

                // ===== ACCOUNTING MODULE =====
                // Facturas (simulado por ahora)
                Integer totalInvoices = monthOrders.size(); // TODO: usar InvoiceRepository cuando esté disponible
                Integer lowStockProducts = productRepository.findByInventoryQtyLessThan(10).size();

                // ===== HR MODULE =====
                // Empleados (simulado por ahora)
                Integer totalEmployees = 0; // TODO: conectar con EmployeeRepository
                Double employeesChange = 0.0;

                // ===== COMMUNICATIONS MODULE =====
                // Conversaciones activas (simulado)
                Integer activeConversations = 12; // TODO: conectar con sistema de chat real

                // Legacy stats para backward compatibility
                DashboardStatsDTO.SalesStats salesStats = new DashboardStatsDTO.SalesStats(
                                totalRevenue,
                                String.format("%+.1f%%", revenueChange),
                                "vs mes anterior",
                                revenueChange > 0 ? "up" : revenueChange < 0 ? "down" : "neutral");

                DashboardStatsDTO.CustomersStats customersStats = new DashboardStatsDTO.CustomersStats(
                                totalCustomers.intValue(),
                                String.format("+%.0f%%", customersChange),
                                "esta semana",
                                "up");

                DashboardStatsDTO.InventoryStats inventoryStats = new DashboardStatsDTO.InventoryStats(
                                totalProducts.intValue(),
                                lowStockProducts,
                                lowStockProducts + " productos con stock bajo",
                                lowStockProducts > 0 ? "down" : "neutral");

                DashboardStatsDTO.ChatbotStats chatbotStats = new DashboardStatsDTO.ChatbotStats(
                                activeConversations,
                                "Activo ✓",
                                "Hace 2 min",
                                "up");

                return DashboardStatsDTO.builder()
                                // New fields for modular dashboard
                                .totalRevenue(totalRevenue)
                                .revenueChange(revenueChange)
                                .totalOrders(totalOrders)
                                .ordersChange(ordersChange)
                                .totalCustomers(totalCustomers.intValue())
                                .customersChange(customersChange)
                                .totalProducts(totalProducts.intValue())
                                .productsChange(0.0)
                                .totalInvoices(totalInvoices)
                                .invoicesChange(0.0)
                                .pendingQuotes(0)
                                .lowStockProducts(lowStockProducts)
                                .totalEmployees(totalEmployees)
                                .employeesChange(employeesChange)
                                .totalPayroll(0.0)
                                .activeConversations(activeConversations)
                                .messagesChange(15.0)
                                // Legacy fields
                                .sales(salesStats)
                                .customers(customersStats)
                                .inventory(inventoryStats)
                                .chatbot(chatbotStats)
                                .build();
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
