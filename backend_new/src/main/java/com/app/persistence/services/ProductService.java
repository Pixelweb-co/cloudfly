package com.app.persistence.services;

import com.app.dto.ProductCreateRequest;
import com.app.persistence.entity.Product;
import com.app.persistence.entity.ProductCategory;
import com.app.persistence.entity.ProductImage;
import com.app.persistence.entity.Category;
import com.app.persistence.entity.Media;
import com.app.events.ProductEventProducer;
import com.app.persistence.repository.ProductCategoryRepository;
import com.app.persistence.repository.CategoryRepository;
import com.app.persistence.repository.ProductRepository;
import com.app.persistence.repository.ProductImageRepository;
import com.app.persistence.repository.MediaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductCategoryRepository productCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final MediaRepository mediaRepository;
    private final ProductEventProducer productEventProducer;

    public Mono<ProductCreateRequest> saveProduct(ProductCreateRequest request) {
        if (request.getTenantId() == null || request.getTenantId() == 0) {
            log.error("❌ [PRODUCT-SERVICE] Cannot save product: tenantId is null or 0. Request: {}", request);
            return Mono.error(new IllegalArgumentException("El ID de cliente (tenantId) es obligatorio para crear un producto."));
        }

        Product product = Product.builder()
                .id(request.getId())
                .tenantId(request.getTenantId())
                .companyId(request.getCompanyId())
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
                    log.info("Product saved successfully with ID: {}", savedProduct.getId());
                    request.setId(savedProduct.getId());
                    
                    Mono<Void> categoryUpdate = Mono.empty();
                    if (request.getCategoryIds() != null) {
                        categoryUpdate = productCategoryRepository.deleteByProductId(savedProduct.getId())
                                .thenMany(Flux.fromIterable(request.getCategoryIds()))
                                .flatMap(catId -> productCategoryRepository.save(ProductCategory.builder()
                                        .productId(savedProduct.getId())
                                        .categoryId(catId)
                                        .build()))
                                .then();
                    }

                    Mono<Void> imageUpdate = Mono.empty();
                    if (request.getImageIds() != null) {
                        imageUpdate = productImageRepository.deleteByProductId(savedProduct.getId())
                                .thenMany(Flux.fromIterable(request.getImageIds()))
                                .flatMap(imgId -> productImageRepository.save(ProductImage.builder()
                                        .productId(savedProduct.getId())
                                        .mediaId(imgId)
                                        .build()))
                                .then();
                    }

                    return Mono.when(categoryUpdate, imageUpdate).then(Mono.just(request));
                })
                .flatMap(req -> productEventProducer.publishProductChange(req).thenReturn(req))
                .doOnError(e -> log.error("Error in saveProduct for tenant {}: {}", request.getTenantId(), e.getMessage(), e));
    }

    public Mono<ProductCreateRequest> getById(Long id) {
        return productRepository.findById(id)
                .flatMap(this::enrichProduct);
    }

    public Flux<ProductCreateRequest> listByTenant(Long tenantId) {
        return productRepository.findByTenantId(tenantId)
                .flatMap(this::enrichProduct);
    }

    public Flux<ProductCreateRequest> findAll() {
        return productRepository.findAll()
                .flatMap(this::enrichProduct);
    }

    public Mono<Void> delete(Long id) {
        return productRepository.findById(id)
                .flatMap(product -> productCategoryRepository.deleteByProductId(id)
                        .then(productImageRepository.deleteByProductId(id))
                        .then(productRepository.deleteById(id))
                        .then(productEventProducer.publishProductDelete(id, product.getTenantId())));
    }

    public Mono<ProductCreateRequest> getByBarcode(String barcode, Long tenantId) {
        return productRepository.findByBarcodeAndTenantId(barcode, tenantId)
                .flatMap(this::enrichProduct);
    }

    public Flux<ProductCreateRequest> searchByName(String query, Long tenantId) {
        return productRepository.findByProductNameContainingIgnoreCaseAndTenantId(query, tenantId)
                .flatMap(this::enrichProduct);
    }

    private Mono<ProductCreateRequest> enrichProduct(Product product) {
        Mono<List<Long>> categoriesMono = productCategoryRepository.findByProductId(product.getId())
                .map(ProductCategory::getCategoryId)
                .collectList();

        Mono<List<Long>> imageIdsMono = productImageRepository.findByProductId(product.getId())
                .map(ProductImage::getMediaId)
                .collectList();

        return Mono.zip(categoriesMono, imageIdsMono)
                .flatMap(tuple -> {
                    List<Long> categoryIds = tuple.getT1();
                    List<Long> imageIds = tuple.getT2();
                    
                    Mono<List<String>> catNamesMono = categoryRepository.findAllById(categoryIds)
                            .map(Category::getCategoryName)
                            .collectList();

                    if (imageIds.isEmpty()) {
                        return catNamesMono.map(names -> mapToRequest(product, categoryIds, names, imageIds, List.of()));
                    }
                    
                    return Mono.zip(catNamesMono, mediaRepository.findAllById(imageIds).map(Media::getUrl).collectList())
                            .map(tuple2 -> mapToRequest(product, categoryIds, tuple2.getT1(), imageIds, tuple2.getT2()));
                });
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

    public Flux<ProductCreateRequest> validateStockMultiple(List<Long> productIds, Long tenantId) {
        return productRepository.findByIdInAndTenantId(productIds, tenantId)
                .flatMap(this::enrichProduct);
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
                .flatMap(this::enrichProduct);
    }

    private ProductCreateRequest mapToRequest(Product product, List<Long> categoryIds, List<String> categoryNames, List<Long> imageIds, List<String> imageUrls) {
        return ProductCreateRequest.builder()
                .id(product.getId())
                .tenantId(product.getTenantId())
                .companyId(product.getCompanyId())
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
                .categoryNames(categoryNames)
                .imageIds(imageIds)
                .imageUrls(imageUrls)
                .build();
    }
}
