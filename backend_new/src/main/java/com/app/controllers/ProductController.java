package com.app.controllers;

import com.app.persistence.entity.Product;
import com.app.persistence.services.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<Product> save(@RequestBody Product product) {
        return productService.saveOrUpdate(product);
    }

    @GetMapping("/{id}")
    public Mono<Product> getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @GetMapping("/tenant/{tenantId}")
    public Flux<Product> listByTenant(@PathVariable Long tenantId) {
        return productService.listByTenant(tenantId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id) {
        return productService.delete(id);
    }

    @GetMapping("/barcode/{barcode}")
    public Mono<Product> getByBarcode(@PathVariable String barcode, @RequestParam Long tenantId) {
        return productService.getByBarcode(barcode, tenantId);
    }

    @GetMapping("/search")
    public Flux<Product> searchByName(@RequestParam String query, @RequestParam Long tenantId) {
        return productService.searchByName(query, tenantId);
    }
}
