package com.app.starter1.controllers;

import com.app.starter1.dto.QuoteRequestDTO;
import com.app.starter1.dto.QuoteResponseDTO;
import com.app.starter1.persistence.services.QuoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quotes")
public class QuoteController {

    @Autowired
    private QuoteService quoteService;

    @PostMapping
    public ResponseEntity<QuoteResponseDTO> createQuote(@RequestBody QuoteRequestDTO request) {
        return ResponseEntity.ok(quoteService.createQuote(request));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<QuoteResponseDTO>> getQuotesByTenant(@PathVariable Long tenantId) {
        return ResponseEntity.ok(quoteService.getQuotesByTenant(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteResponseDTO> getQuoteById(@PathVariable Long id) {
        return ResponseEntity.ok(quoteService.getQuoteById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuote(@PathVariable Long id) {
        quoteService.deleteQuote(id);
        return ResponseEntity.noContent().build();
    }
}
