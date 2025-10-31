package com.app.starter1.persistence.services;

import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.Image;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.exeptions.ProductNotFoundException;
import com.app.starter1.persistence.repository.ContratoRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.ImageRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Contract;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ContratoRepository contratoRepository;

    // Inyectar el repositorio de imágenes
    @Autowired
    private ImageRepository imageRepository;

    /**
     * Obtiene los productos asociados a un cliente dado.
     *
     * @param customerId ID del cliente
     * @return Lista de productos asociados al cliente
     */
    public List<Product> getProductsByCustomer(Long customerId) {
        return productRepository.findByCustomer(customerId);
    }

    /**
     * Guarda un producto y actualiza su relación con el contrato asociado al cliente.
     *
     * @param producto Producto a guardar
     * @param clienteId ID del cliente asociado al producto
     * @return Producto guardado
     */
    @Transactional
    public Product guardarProductoConContrato(Product producto, Long customerId) {
        // Obtener el contrato asociado al cliente
        Optional<Contrato> contratoOpt = contratoRepository.findByClienteId(customerId);
        if (!contratoOpt.isPresent()) {
            throw new RuntimeException("Contrato no encontrado para el cliente");
        }

        Contrato contrato = contratoOpt.get();


        // Guardar el producto
        Product productoGuardado = productRepository.save(producto);

        // Agregar el producto a la lista de productos del contrato
        contrato.getProductos().add(productoGuardado);
        contratoRepository.save(contrato); // Guardar el contrato con el producto asociado

        return productoGuardado;
    }


    /**
     * Actualiza los datos de un producto existente.
     *
     * @param productId ID del producto a actualizar
     * @param updatedProduct Datos actualizados del producto
     * @return Producto actualizado
     */
    public Product actualizarProducto(Long productId, Product updatedProduct) {
        Product existingProduct = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto con ID " + productId + " no encontrado"));

        if (updatedProduct.getProductType() != null) existingProduct.setProductType(updatedProduct.getProductType());
        if (updatedProduct.getProductCode() != null) existingProduct.setProductCode(updatedProduct.getProductCode());
        if (updatedProduct.getProductName() != null) existingProduct.setProductName(updatedProduct.getProductName());
        if (updatedProduct.getBrand() != null) existingProduct.setBrand(updatedProduct.getBrand());
        if (updatedProduct.getModel() != null) existingProduct.setModel(updatedProduct.getModel());
        if (updatedProduct.getLicensePlate() != null) existingProduct.setLicensePlate(updatedProduct.getLicensePlate());
        if (updatedProduct.getProductClass() != null) existingProduct.setProductClass(updatedProduct.getProductClass());
        if (updatedProduct.getClassification() != null) existingProduct.setClassification(updatedProduct.getClassification());
        if (updatedProduct.getStatus() != null) existingProduct.setStatus(updatedProduct.getStatus());
        if (updatedProduct.getDateAdded() != null) existingProduct.setDateAdded(updatedProduct.getDateAdded());
        if (updatedProduct.getInvimaRegister() != null) existingProduct.setInvimaRegister(updatedProduct.getInvimaRegister());
        if (updatedProduct.getOrigin() != null) existingProduct.setOrigin(updatedProduct.getOrigin());
        if (updatedProduct.getVoltage() != null) existingProduct.setVoltage(updatedProduct.getVoltage());
        if (updatedProduct.getPower() != null) existingProduct.setPower(updatedProduct.getPower());
        if (updatedProduct.getFrequency() != null) existingProduct.setFrequency(updatedProduct.getFrequency());
        if (updatedProduct.getAmperage() != null) existingProduct.setAmperage(updatedProduct.getAmperage());
        if (updatedProduct.getPurchaseDate() != null) existingProduct.setPurchaseDate(updatedProduct.getPurchaseDate());
        if (updatedProduct.getBookValue() != null) existingProduct.setBookValue(updatedProduct.getBookValue());
        if (updatedProduct.getSupplier() != null) existingProduct.setSupplier(updatedProduct.getSupplier());
        if (updatedProduct.getWarranty() != null) existingProduct.setWarranty(updatedProduct.getWarranty());
        if (updatedProduct.getWarrantyStartDate() != null) existingProduct.setWarrantyStartDate(updatedProduct.getWarrantyStartDate());
        if (updatedProduct.getWarrantyEndDate() != null) existingProduct.setWarrantyEndDate(updatedProduct.getWarrantyEndDate());
        if (updatedProduct.getManual() != null) existingProduct.setManual(updatedProduct.getManual());
        if (updatedProduct.getPeriodicity() != null) existingProduct.setPeriodicity(updatedProduct.getPeriodicity());
        if (updatedProduct.getLocation() != null) existingProduct.setLocation(updatedProduct.getLocation());
        if (updatedProduct.getPlacement() != null) existingProduct.setPlacement(updatedProduct.getPlacement());
        if (updatedProduct.getVerification() != null) existingProduct.setVerification(updatedProduct.getVerification());
        if (updatedProduct.getImage() != null) existingProduct.setImage(updatedProduct.getImage());

        return productRepository.save(existingProduct);
    }


    private void eliminarImagen(Image imagen) {
        try {
            // Eliminar la imagen del sistema de archivos
            Path filePath = Paths.get("uploads/images/" + imagen.getName());
            Files.deleteIfExists(filePath);

            // Eliminar la imagen de la base de datos
            imageRepository.delete(imagen);
        } catch (Exception e) {
            throw new RuntimeException("Error al eliminar la imagen: " + e.getMessage(), e);
        }
    }


}
