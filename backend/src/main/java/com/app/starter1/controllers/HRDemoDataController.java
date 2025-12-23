package com.app.starter1.controllers;

import com.app.starter1.services.HRDemoDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr/demo")
@RequiredArgsConstructor
public class HRDemoDataController {

    private final HRDemoDataService demoDataService;

    @PostMapping("/generate")
    public ResponseEntity<String> generateDemoData(@RequestParam Long customerId) {
        demoDataService.generateDemoData(customerId);
        return ResponseEntity.ok("Demo data generated successfully");
    }
}
