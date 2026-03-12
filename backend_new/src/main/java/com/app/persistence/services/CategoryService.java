package com.app.persistence.services;

import com.app.dto.CategoryCreateRequest;
import com.app.dto.CategoryResponse;
import com.app.persistence.entity.Category;
import com.app.persistence.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserService userService;

    public Mono<CategoryResponse> createCategory(CategoryCreateRequest request) {
        return userService.getCurrentUser()
                .flatMap(user -> {
                    Category category = Category.builder()
                            .categoryName(request.getNombreCategoria())
                            .description(request.getDescription())
                            .parentCategory(request.getParentCategory())
                            .status(request.getStatus() != null ? request.getStatus() : true)
                            .tenantId(user.getCustomerId())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return categoryRepository.save(category)
                            .map(this::toResponse);
                });
    }

    public Flux<CategoryResponse> getAllTenantCategories(Long tenantId) {
        return categoryRepository.findByTenantId(tenantId)
                .map(this::toResponse);
    }

    public Mono<CategoryResponse> getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .map(this::toResponse);
    }

    public Mono<Void> deleteCategory(Long id) {
        return categoryRepository.deleteById(id);
    }

    public Mono<CategoryResponse> updateCategory(Long id, CategoryCreateRequest request) {
        return categoryRepository.findById(id)
                .flatMap(category -> {
                    category.setCategoryName(request.getNombreCategoria());
                    category.setDescription(request.getDescription());
                    category.setParentCategory(request.getParentCategory());
                    category.setStatus(request.getStatus() != null ? request.getStatus() : category.getStatus());
                    category.setUpdatedAt(LocalDateTime.now());
                    return categoryRepository.save(category);
                })
                .map(this::toResponse);
    }

    public Mono<CategoryResponse> toggleCategoryStatus(Long id) {
        return categoryRepository.findById(id)
                .flatMap(category -> {
                    category.setStatus(!category.getStatus());
                    category.setUpdatedAt(LocalDateTime.now());
                    return categoryRepository.save(category);
                })
                .map(this::toResponse);
    }

    private CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .nombreCategoria(category.getCategoryName())
                .description(category.getDescription())
                .parentCategory(category.getParentCategory())
                .status(category.getStatus())
                .tenantId(category.getTenantId())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
