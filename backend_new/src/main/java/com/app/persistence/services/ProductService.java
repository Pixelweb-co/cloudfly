package com.app.persistence.services;

import com.app.persistence.entity.Product;
import com.app.persistence.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public Mono<Product> saveOrUpdate(Product product) {
        if (product.getId() == null) {
            product.setCreatedAt(LocalDateTime.now());
        }
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public Mono<Product> getById(Long id) {
        return productRepository.findById(id);
    }

    public Flux<Product> listByTenant(Long tenantId) {
        return productRepository.findByTenantId(tenantId);
    }

    public Mono<Void> delete(Long id) {
        return productRepository.deleteById(id);
    }

    public Mono<Product> getByBarcode(String barcode, Long tenantId) {
        return productRepository.findByBarcodeAndTenantId(barcode, tenantId);
    }

    public Flux<Product> searchByName(String query, Long tenantId) {
        return productRepository.findByProductNameContainingIgnoreCaseAndTenantId(query, tenantId);
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

    public Mono<Product> reduceStock(Long productId, Integer quantity) {
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
                });
    }

    public Flux<Product> findAll() {
        return productRepository.findAll();
    }
}
