package com.app.starter1.controllers;

import com.app.starter1.dto.OverviewStats;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {


    @GetMapping("/overview")
    public ResponseEntity<OverviewStats> getOverview() {
        long solicitudes = 0;
        long clientes = 0;
        long equipos = 0;
        long reportes = 0;

        OverviewStats stats = new OverviewStats(solicitudes, clientes, equipos, reportes);
        return ResponseEntity.ok(stats);
    }
}
