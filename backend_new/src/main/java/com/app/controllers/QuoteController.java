package com.app.controllers;

import com.app.dto.QuoteRequestDTO;
import com.app.dto.QuoteResponseDTO;
import com.app.persistence.services.QuoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<QuoteResponseDTO> createQuote(@RequestBody QuoteRequestDTO request) {
        return quoteService.createQuote(request);
    }

    @GetMapping("/tenant/{tenantId}")
    public Flux<QuoteResponseDTO> getQuotesByTenant(@PathVariable Long tenantId) {
        return quoteService.listByTenant(tenantId);
    }

    @GetMapping("/{id}")
    public Mono<QuoteResponseDTO> getQuoteById(@PathVariable Long id) {
        return quoteService.getById(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteQuote(@PathVariable Long id) {
        return quoteService.deleteQuote(id);
    }
}
