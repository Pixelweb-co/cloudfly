package com.app.controllers;

import com.app.dto.CategoryCreateRequest;
import com.app.dto.CategoryResponse;
import com.app.persistence.services.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping({ "/categorias", "/categories" })
@RequiredArgsConstructor
@Slf4j
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<CategoryResponse> createCategory(@Valid @RequestBody CategoryCreateRequest request) {
        log.info("Creating new category: {}", request.getNombreCategoria());
        return categoryService.createCategory(request);
    }

    @GetMapping("/{id}")
    public Mono<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return categoryService.getCategoryById(id);
    }

    @GetMapping("/customer/{tenantId}")
    public Flux<CategoryResponse> getAllTenantCategories(@PathVariable Long tenantId) {
        return categoryService.getAllTenantCategories(tenantId);
    }

    @PutMapping("/{id}")
    public Mono<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryCreateRequest request) {
        return categoryService.updateCategory(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> deleteCategory(@PathVariable Long id) {
        return categoryService.deleteCategory(id);
    }

    @PatchMapping("/{id}/toggle-status")
    public Mono<CategoryResponse> toggleCategoryStatus(@PathVariable Long id) {
        return categoryService.toggleCategoryStatus(id);
    }
}
