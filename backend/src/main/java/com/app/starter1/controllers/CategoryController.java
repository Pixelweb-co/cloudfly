package com.app.starter1.controllers;

import com.app.starter1.dto.CategoryCreateRequest;
import com.app.starter1.dto.CategoryResponse;
import com.app.starter1.persistence.services.CategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categorias")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }



    @GetMapping("/customer/{tenantId}")
    public ResponseEntity<List<CategoryResponse>> getAllTenantCategories(@PathVariable Long tenantId) {
        return ResponseEntity.ok(categoryService.getAllTenantCategories(tenantId));
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> getAllCategorys() {
        return ResponseEntity.ok(categoryService.getAllCategorys());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryCreateRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<CategoryResponse> toggleCategoryStatus(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.toggleCategoryStatus(id));
    }
}
