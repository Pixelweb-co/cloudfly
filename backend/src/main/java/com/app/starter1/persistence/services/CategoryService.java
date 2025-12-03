package com.app.starter1.persistence.services;

import com.app.starter1.dto.CategoryCreateRequest;
import com.app.starter1.dto.CategoryResponse;
import com.app.starter1.persistence.entity.Category;
import com.app.starter1.persistence.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        Category category = Category.builder()
                .categoryName(request.nombreCategoria())
                .description(request.description())
                .parentCategory(request.parentCategory())
                .tenantId(request.tenantId())
                .status(request.status())
                .build();

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category no encontrado con ID: " + id));
        return mapToResponse(category);
    }



    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllTenantCategories(Long tenantId) {
        return categoryRepository.findByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategorys() {
        return categoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryCreateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category no encontrado con ID: " + id));

        category.setCategoryName(request.nombreCategoria());
        category.setDescription(request.description());
        category.setParentCategory(request.parentCategory());
        category.setStatus(request.status());

        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category no encontrado con ID: " + id);
        }
        categoryRepository.deleteById(id);
    }

    @Transactional
    public CategoryResponse toggleCategoryStatus(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category no encontrado con ID: " + id));

        category.setStatus(!category.getStatus());
        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    private CategoryResponse mapToResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getCategoryName(),
                category.getDescription(),
                category.getParentCategory(),
                category.getStatus(), 
                category.getTenantId(), 
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
