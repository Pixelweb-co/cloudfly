package com.app.controllers;

import com.app.dto.ProductCreateRequest;
import com.app.persistence.services.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ProductCreateRequest> save(@RequestBody ProductCreateRequest product) {
        return productService.saveProduct(product);
    }

    @GetMapping
    public Flux<ProductCreateRequest> findAll() {
        return productService.findAll();
    }

    @GetMapping("/{id}")
    public Mono<ProductCreateRequest> getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @GetMapping("/tenant/{tenantId}")
    public Flux<ProductCreateRequest> listByTenant(@PathVariable Long tenantId) {
        return productService.listByTenant(tenantId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id) {
        return productService.delete(id);
    }

    @GetMapping("/barcode/{barcode}")
    public Mono<ProductCreateRequest> getByBarcode(@PathVariable String barcode, @RequestParam Long tenantId) {
        return productService.getByBarcode(barcode, tenantId);
    }

    @GetMapping("/search")
    public Flux<ProductCreateRequest> searchByName(@RequestParam String query, @RequestParam Long tenantId) {
        return productService.searchByName(query, tenantId);
    }

    @GetMapping("/stock/multiple")
    public Flux<ProductCreateRequest> validateStockMultiple(@RequestParam List<Long> ids, @RequestParam Long tenantId) {
        return productService.validateStockMultiple(ids, tenantId);
    }
}
