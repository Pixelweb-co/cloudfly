package com.app.persistence.services;

import com.app.dto.ProductCreateRequest;
import com.app.persistence.entity.Product;
import com.app.persistence.entity.ProductCategory;
import com.app.persistence.repository.ProductCategoryRepository;
import com.app.persistence.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;

    public Mono<ProductCreateRequest> saveProduct(ProductCreateRequest request) {
        Product product = Product.builder()
                .id(request.getId())
                .tenantId(request.getTenantId())
                .productName(request.getProductName())
                .description(request.getDescription())
                .productType(request.getProductType())
                .price(request.getPrice())
                .salePrice(request.getSalePrice())
                .sku(request.getSku())
                .barcode(request.getBarcode())
                .manageStock(request.getManageStock())
                .inventoryStatus(request.getInventoryStatus())
                .allowBackorders(request.getAllowBackorders())
                .inventoryQty(request.getInventoryQty())
                .soldIndividually(request.getSoldIndividually())
                .weight(request.getWeight())
                .dimensions(request.getDimensions())
                .upsellProducts(request.getUpsellProducts())
                .crossSellProducts(request.getCrossSellProducts())
                .status(request.getStatus())
                .brand(request.getBrand())
                .model(request.getModel())
                .build();

        if (product.getId() == null) {
            product.setCreatedAt(LocalDateTime.now());
        }
        product.setUpdatedAt(LocalDateTime.now());

        return productRepository.save(product)
                .flatMap(savedProduct -> {
                    request.setId(savedProduct.getId());
                    if (request.getCategoryIds() == null || request.getCategoryIds().isEmpty()) {
                        return Mono.just(request);
                    }
                    return productCategoryRepository.deleteByProductId(savedProduct.getId())
                            .thenMany(Flux.fromIterable(request.getCategoryIds()))
                            .flatMap(catId -> productCategoryRepository.save(ProductCategory.builder()
                                    .productId(savedProduct.getId())
                                    .categoryId(catId)
                                    .build()))
                            .then(Mono.just(request));
                });
    }

    public Mono<ProductCreateRequest> getById(Long id) {
        return productRepository.findById(id)
                .flatMap(product -> productCategoryRepository.findByProductId(product.getId())
                        .map(ProductCategory::getCategoryId)
                        .collectList()
                        .map(categoryIds -> mapToRequest(product, categoryIds)));
    }

    public Flux<ProductCreateRequest> listByTenant(Long tenantId) {
        return productRepository.findByTenantId(tenantId)
                .flatMap(product -> productCategoryRepository.findByProductId(product.getId())
                        .map(ProductCategory::getCategoryId)
                        .collectList()
                        .map(categoryIds -> mapToRequest(product, categoryIds)));
    }

    public Flux<ProductCreateRequest> findAll() {
        return productRepository.findAll()
                .flatMap(product -> productCategoryRepository.findByProductId(product.getId())
                        .map(ProductCategory::getCategoryId)
                        .collectList()
                        .map(categoryIds -> mapToRequest(product, categoryIds)));
    }

    public Mono<Void> delete(Long id) {
        return productCategoryRepository.deleteByProductId(id)
                .then(productRepository.deleteById(id));
    }

    public Mono<ProductCreateRequest> getByBarcode(String barcode, Long tenantId) {
        return productRepository.findByBarcodeAndTenantId(barcode, tenantId)
                .flatMap(product -> productCategoryRepository.findByProductId(product.getId())
                        .map(ProductCategory::getCategoryId)
                        .collectList()
                        .map(categoryIds -> mapToRequest(product, categoryIds)));
    }

    public Flux<ProductCreateRequest> searchByName(String query, Long tenantId) {
        return productRepository.findByProductNameContainingIgnoreCaseAndTenantId(query, tenantId)
                .flatMap(product -> productCategoryRepository.findByProductId(product.getId())
                        .map(ProductCategory::getCategoryId)
                        .collectList()
                        .map(categoryIds -> mapToRequest(product, categoryIds)));
    }

    public Mono<Boolean> validateStock(Long productId, Integer quantity) {
        return productRepository.findById(productId)
                .map(product -> {
                    if (product.getManageStock() == null || !product.getManageStock()) {
                        return true;
                    }
                    int currentStock = product.getInventoryQty() != null ? product.getInventoryQty() : 0;
                    return currentStock >= quantity;
                })
                .defaultIfEmpty(false);
    }

    public Mono<ProductCreateRequest> reduceStock(Long productId, Integer quantity) {
        return productRepository.findById(productId)
                .flatMap(product -> {
                    if (product.getManageStock() == null || !product.getManageStock()) {
                        return Mono.just(product);
                    }
                    int currentStock = product.getInventoryQty() != null ? product.getInventoryQty() : 0;
                    if (currentStock < quantity) {
                        return Mono.error(
                                new IllegalStateException("Stock insuficiente para: " + product.getProductName()));
                    }
                    product.setInventoryQty(currentStock - quantity);
                    if (product.getInventoryQty() == 0) {
                        product.setInventoryStatus("OUT_OF_STOCK");
                    }
                    return productRepository.save(product);
                })
                .flatMap(product -> productCategoryRepository.findByProductId(product.getId())
                        .map(ProductCategory::getCategoryId)
                        .collectList()
                        .map(categoryIds -> mapToRequest(product, categoryIds)));
    }

    private ProductCreateRequest mapToRequest(Product product, List<Long> categoryIds) {
        return ProductCreateRequest.builder()
                .id(product.getId())
                .tenantId(product.getTenantId())
                .productName(product.getProductName())
                .description(product.getDescription())
                .productType(product.getProductType())
                .price(product.getPrice())
                .salePrice(product.getSalePrice())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .manageStock(product.getManageStock())
                .inventoryStatus(product.getInventoryStatus())
                .allowBackorders(product.getAllowBackorders())
                .inventoryQty(product.getInventoryQty())
                .soldIndividually(product.getSoldIndividually())
                .weight(product.getWeight())
                .dimensions(product.getDimensions())
                .upsellProducts(product.getUpsellProducts())
                .crossSellProducts(product.getCrossSellProducts())
                .status(product.getStatus())
                .brand(product.getBrand())
                .model(product.getModel())
                .categoryIds(categoryIds)
                .build();
    }
}
