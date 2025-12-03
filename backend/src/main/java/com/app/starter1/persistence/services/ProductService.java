package com.app.starter1.persistence.services;

import com.app.starter1.dto.ProductRequestDTO;
import com.app.starter1.dto.ProductResponseDTO;
import com.app.starter1.persistence.entity.Category;
import com.app.starter1.persistence.entity.Media;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.repository.CategoryRepository;
import com.app.starter1.persistence.repository.MediaRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final MediaRepository mediaRepository;

    public ProductService(ProductRepository productRepository,
            CategoryRepository categoryRepository,
            MediaRepository mediaRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.mediaRepository = mediaRepository;
    }

    /*
     * ------------------------------ Crear / Actualizar
     * ------------------------------
     */

    @Transactional
    public ProductResponseDTO saveOrUpdate(ProductRequestDTO dto) {

        if (dto.getProductName() == null || dto.getProductName().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del producto es obligatorio");
        }
        if (dto.getPrice() == null) {
            throw new IllegalArgumentException("El precio del producto es obligatorio");
        }

        Product product;

        if (dto.getId() != null) {
            // actualizar
            product = productRepository.findById(dto.getId())
                    .orElseThrow(() -> new NoSuchElementException("Producto no encontrado con id " + dto.getId()));
        } else {
            // crear
            product = new Product();
        }

        product.setTenantId(dto.getTenantId());

        product.setProductName(dto.getProductName());
        product.setDescription(dto.getDescription());
        product.setProductType(dto.getProductType());

        product.setPrice(dto.getPrice() != null ? dto.getPrice() : BigDecimal.ZERO);
        product.setSalePrice(dto.getSalePrice());

        product.setSku(dto.getSku());
        product.setBarcode(dto.getBarcode());

        product.setManageStock(dto.getManageStock());
        product.setInventoryStatus(dto.getInventoryStatus());
        product.setAllowBackorders(dto.getAllowBackorders());
        product.setInventoryQty(dto.getInventoryQty());

        product.setSoldIndividually(dto.getSoldIndividually());

        product.setWeight(dto.getWeight());
        product.setDimensions(dto.getDimensions());

        product.setUpsellProducts(dto.getUpsellProducts());
        product.setCrossSellProducts(dto.getCrossSellProducts());

        product.setStatus(dto.getStatus());
        product.setBrand(dto.getBrand());
        product.setModel(dto.getModel());

        // ----------------- Categorías -----------------
        if (dto.getCategoryIds() != null && !dto.getCategoryIds().isEmpty()) {
            List<Category> categories = categoryRepository.findAllById(dto.getCategoryIds());
            product.setCategories(new HashSet<>(categories));
        } else {
            product.getCategories().clear();
        }

        // ----------------- Imágenes (Media) -----------------
        if (dto.getImageIds() != null && !dto.getImageIds().isEmpty()) {
            List<Media> medias = mediaRepository.findAllById(dto.getImageIds());
            product.setImages(new HashSet<>(medias));
        } else {
            product.getImages().clear();
        }

        Product saved = productRepository.save(product);

        return toResponseDTO(saved);
    }

    /*
     * ------------------------------ Obtener por id ------------------------------
     */

    @Transactional(readOnly = true)
    public ProductResponseDTO getById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Producto no encontrado con id " + id));

        return toResponseDTO(product);
    }

    /*
     * ------------------------------ Listar por tenant
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> listByTenant(Long tenantId) {
        List<Product> products = productRepository.findByTenantId(tenantId);
        return products.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /* ------------------------------ Borrar ------------------------------ */

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new NoSuchElementException("Producto no encontrado con id " + id);
        }
        productRepository.deleteById(id);
    }

    /* ------------------------------ Mapper ------------------------------ */

    private ProductResponseDTO toResponseDTO(Product p) {
        List<Long> categoryIds = p.getCategories().stream()
                .map(Category::getId)
                .collect(Collectors.toList());

        List<Long> imageIds = p.getImages().stream()
                .map(Media::getId)
                .collect(Collectors.toList());

        return ProductResponseDTO.builder()
                .id(p.getId())
                .tenantId(p.getTenantId())
                .productName(p.getProductName())
                .description(p.getDescription())
                .productType(p.getProductType())
                .price(p.getPrice())
                .salePrice(p.getSalePrice())
                .sku(p.getSku())
                .barcode(p.getBarcode())
                .manageStock(p.getManageStock())
                .inventoryStatus(p.getInventoryStatus())
                .allowBackorders(p.getAllowBackorders())
                .inventoryQty(p.getInventoryQty())
                .soldIndividually(p.getSoldIndividually())
                .weight(p.getWeight())
                .dimensions(p.getDimensions())
                .upsellProducts(p.getUpsellProducts())
                .crossSellProducts(p.getCrossSellProducts())
                .status(p.getStatus())
                .brand(p.getBrand())
                .model(p.getModel())
                .categoryIds(categoryIds)
                .imageIds(imageIds)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    /*
     * ------------------------------ POS: Búsqueda por Barcode
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public ProductResponseDTO getByBarcode(String barcode, Long tenantId) {
        if (barcode == null || barcode.trim().isEmpty()) {
            throw new IllegalArgumentException("El código de barras no puede estar vacío");
        }

        Product product = productRepository.findByBarcodeAndTenantId(barcode, tenantId)
                .orElseThrow(() -> new NoSuchElementException("Producto no encontrado con barcode: " + barcode));

        return toResponseDTO(product);
    }

    /*
     * ------------------------------ POS: Búsqueda por Nombre
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> searchByName(String query, Long tenantId) {
        if (query == null || query.trim().isEmpty()) {
            throw new IllegalArgumentException("El término de búsqueda no puede estar vacío");
        }

        List<Product> products = productRepository.findByProductNameContainingIgnoreCaseAndTenantId(query, tenantId);

        return products.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /*
     * ------------------------------ POS: Validar Stock
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public boolean validateStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Producto no encontrado con id " + productId));

        // Si no maneja stock, siempre está disponible
        if (product.getManageStock() == null || !product.getManageStock()) {
            return true;
        }

        // Verificar que haya stock suficiente
        Integer currentStock = product.getInventoryQty() != null ? product.getInventoryQty() : 0;
        return currentStock >= quantity;
    }

    /*
     * ------------------------------ POS: Reducir Stock
     * ------------------------------
     */

    @Transactional
    public void reduceStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Producto no encontrado con id " + productId));

        // Si no maneja stock, no hacer nada
        if (product.getManageStock() == null || !product.getManageStock()) {
            return;
        }

        Integer currentStock = product.getInventoryQty() != null ? product.getInventoryQty() : 0;

        if (currentStock < quantity) {
            throw new IllegalStateException("Stock insuficiente para el producto: " + product.getProductName()
                    + ". Disponible: " + currentStock + ", Solicitado: " + quantity);
        }

        // Reducir stock
        product.setInventoryQty(currentStock - quantity);

        // Actualizar estado si es necesario
        if (product.getInventoryQty() == 0) {
            product.setInventoryStatus("OUT_OF_STOCK");
        } else if (product.getInventoryQty() > 0 && "OUT_OF_STOCK".equals(product.getInventoryStatus())) {
            product.setInventoryStatus("IN_STOCK");
        }

        productRepository.save(product);
    }

    /*
     * ------------------------------ POS: Restaurar Stock (para cancelaciones)
     * ------------------------------
     */

    @Transactional
    public void restoreStock(Long productId, Integer quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Producto no encontrado con id " + productId));

        // Si no maneja stock, no hacer nada
        if (product.getManageStock() == null || !product.getManageStock()) {
            return;
        }

        Integer currentStock = product.getInventoryQty() != null ? product.getInventoryQty() : 0;

        // Restaurar stock
        product.setInventoryQty(currentStock + quantity);

        // Actualizar estado
        if (product.getInventoryQty() > 0 && "OUT_OF_STOCK".equals(product.getInventoryStatus())) {
            product.setInventoryStatus("IN_STOCK");
        }

        productRepository.save(product);
    }
}
