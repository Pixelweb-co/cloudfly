package com.app.starter1.controllers;

import com.app.starter1.dto.ProductRequestDTO;
import com.app.starter1.dto.ProductResponseDTO;
import com.app.starter1.persistence.services.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // Crear o actualizar producto
    @PostMapping
    public ResponseEntity<ProductResponseDTO> save(@RequestBody ProductRequestDTO request) {
        ProductResponseDTO saved = productService.saveOrUpdate(request);
        return ResponseEntity.ok(saved);
    }

    // Obtener producto por id
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getById(@PathVariable Long id) {
        ProductResponseDTO dto = productService.getById(id);
        return ResponseEntity.ok(dto);
    }

    // Listar productos por tenant
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<ProductResponseDTO>> listByTenant(@PathVariable Long tenantId) {
        List<ProductResponseDTO> list = productService.listByTenant(tenantId);
        return ResponseEntity.ok(list);
    }

    // Eliminar producto
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /*
     * ------------------------------ POS Endpoints ------------------------------
     */

    /**
     * Buscar producto por código de barras
     * Endpoint para scanners de POS
     */
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ProductResponseDTO> getByBarcode(
            @PathVariable String barcode,
            @RequestParam Long tenantId) {
        ProductResponseDTO dto = productService.getByBarcode(barcode, tenantId);
        return ResponseEntity.ok(dto);
    }

    /**
     * Buscar productos por nombre (autocompletado)
     * Útil para buscar productos mientras se escribe
     */
    @GetMapping("/search")
    public ResponseEntity<List<ProductResponseDTO>> searchByName(
            @RequestParam String query,
            @RequestParam Long tenantId) {
        List<ProductResponseDTO> products = productService.searchByName(query, tenantId);
        return ResponseEntity.ok(products);
    }
}
