package com.app.starter1.controllers;

import com.app.starter1.dto.OverviewStats;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import com.app.starter1.persistence.repository.ReportRepository;
import com.app.starter1.persistence.repository.SolicitudRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final SolicitudRepository solicitudRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ReportRepository reportRepository;

    @GetMapping("/overview")
    public ResponseEntity<OverviewStats> getOverview() {
        long solicitudes = solicitudRepository.count();
        long clientes = customerRepository.count();
        long equipos = productRepository.count();
        long reportes = reportRepository.count();

        OverviewStats stats = new OverviewStats(solicitudes, clientes, equipos, reportes);
        return ResponseEntity.ok(stats);
    }
}
