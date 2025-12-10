package com.app.starter1.controllers;

import com.app.starter1.dto.OverviewStats;
import com.app.starter1.dto.dashboard.*;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import com.app.starter1.persistence.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<OverviewStats> getOverview() {
        long solicitudes = 0;
        long clientes = 0;
        long equipos = 0;
        long reportes = 0;

        OverviewStats stats = new OverviewStats(solicitudes, clientes, equipos, reportes);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesChartDTO> getSalesChart(
            @RequestParam(defaultValue = "7d") String period) {
        return ResponseEntity.ok(dashboardService.getSalesChart(period));
    }

    @GetMapping("/activity")
    public ResponseEntity<List<ActivityDTO>> getRecentActivity(
            @RequestParam(defaultValue = "5") Integer limit) {
        return ResponseEntity.ok(dashboardService.getRecentActivity(limit));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductDTO>> getTopProducts(
            @RequestParam(defaultValue = "week") String period) {
        return ResponseEntity.ok(dashboardService.getTopProducts(period));
    }
}
