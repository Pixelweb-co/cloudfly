package com.app.starter1.controllers;

import com.app.starter1.dto.ProductFileRequest;
import com.app.starter1.dto.ProductoRequest;
import com.app.starter1.dto.ProductoRequestV;
import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.Image;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.repository.ContratoRepository;
import com.app.starter1.persistence.repository.ImageRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import com.app.starter1.persistence.repository.SolicitudRepository;
import com.app.starter1.persistence.services.ProductService;
import com.app.starter1.persistence.services.StorageService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.time.format.DateTimeFormatter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.logging.Logger;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    ProductRepository productRepository;

    @Autowired
    ProductService productService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    StorageService storageService;

    @Autowired
    HttpServletRequest request;

    @Autowired
    ImageRepository imageRepository;

    @Autowired
    ContratoRepository contratoRepository;

    @Autowired
    SolicitudRepository solicitudRepository;

    @GetMapping
    @Transactional
    // Obtener todos los products
    public List<Product> findAll() {
        return productRepository.findAllWithImage();
    }

    @GetMapping("/customer/{id_customer}")
    public ResponseEntity<List<Product>> getProductsByCustomer(@PathVariable Long id_customer) {
        List<Product> products = productService.getProductsByCustomer(id_customer);
        return ResponseEntity.ok(products);
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Product> crearProducto(
            @RequestPart("producto") String productoJson,
            @RequestPart(value = "file", required = false) MultipartFile file
            ) throws JsonProcessingException {



        String path = storageService.Store(file);
        String host = request.getRequestURL().toString().replace(request.getRequestURI(),"");
        String url = ServletUriComponentsBuilder
                .fromHttpUrl(host)
                .path("/media/")
                .toString();
        // Deserializar el JSON del producto

        ProductoRequest productoRequest = objectMapper.readValue(productoJson, ProductoRequest.class);
        Product producto = convertirAEntidad(productoRequest);

        Product productoGuardado = productService.guardarProductoConContrato(producto, productoRequest.getCustomer());


        //elacion imagen

        Image image = new Image();

        image.setEquipment(productoGuardado.getId());
        image.setName(path); // Ruta del archivo devuelta por Store

        // Establecer la fecha formateada
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM-dd-yy");
        String formattedDate = LocalDate.now().format(dateFormatter);

        // Establecer la hora formateada
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
        String formattedTime = LocalTime.now().format(timeFormatter);

        image.setDate(formattedDate);  // Fecha formateada en MM-dd-yy
        image.setHour(formattedTime);  // Hora formateada en HH:mm:ss
        imageRepository.save(image);

        productoGuardado.setImage(image);
        productRepository.save(productoGuardado);

        return ResponseEntity.status(HttpStatus.CREATED).body(productoGuardado);
    }

    private Product convertirAEntidadF(ProductoRequestV productoRequestV) {
        return Product.builder()

                .verification(productoRequestV.getVerification())
                .build();
    }

    private Product convertirAEntidad(ProductoRequest productoRequest) {
        return Product.builder()
                .placement(productoRequest.getPlacement())
                .location(productoRequest.getLocation())
                .periodicity(productoRequest.getPeriodicity())
                .manual(productoRequest.getManual())
                .classification(productoRequest.getClassification())
                .warranty(productoRequest.getWarranty())
                .warrantyStartDate(LocalDate.parse(productoRequest.getWarrantyStartDate()))
                .warrantyEndDate(LocalDate.parse(productoRequest.getWarrantyEndDate()))
                .supplier(productoRequest.getSupplier())
                .bookValue(productoRequest.getBookValue())
                .purchaseDate(LocalDate.parse(productoRequest.getPurchaseDate()))
                .amperage(productoRequest.getAmperage())
                .frequency(productoRequest.getFrequency())
                .power(productoRequest.getPower())
                .voltage(productoRequest.getVoltage())
                .origin(productoRequest.getOrigin())
                .invimaRegister(productoRequest.getInvimaRegister())
                .status(productoRequest.getStatus())
                .licensePlate(productoRequest.getLicensePlate())
                .model(productoRequest.getModel())
                .brand(productoRequest.getBrand())
                .productName(productoRequest.getProductName())
                .productCode(productoRequest.getProductCode())
                .productType(productoRequest.getTypeDevice())
                .customer(productoRequest.getCustomer())
                .verification(productoRequest.getVerification())
                .build();
    }

    @Transactional
    @DeleteMapping(path = "/{id}")
    public ResponseEntity<String> EliminarProducto(@PathVariable Long id) {
        // Verificar si el producto existe
        Optional<Product> producto = productRepository.findById(id);
        if (!producto.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Producto no encontrado.");
        }

        Product product = producto.get();
        Long clienteId = product.getCustomer();

        // Verificar si el producto está asociado a un contrato y eliminar la relación
        Optional<Contrato> contratoOpt = contratoRepository.findByClienteId(clienteId);
        if (contratoOpt.isPresent()) {
            Contrato contrato = contratoOpt.get();
            contrato.getProductos().remove(product);  // Eliminar producto del contrato
            contratoRepository.save(contrato);  // Guardar cambios en el contrato
        }


        // Eliminar el producto
        productRepository.deleteById(product.getId());

        return ResponseEntity.ok("Producto eliminado correctamente.");
    }


    @Transactional
    @PutMapping(path = "/verification/{id}")
    public ResponseEntity<Product> actualizarProductoVerification(
            @PathVariable Long id,
            @RequestBody String productoJson
    ) throws JsonProcessingException {

        System.out.println(productoJson);

        ProductoRequestV productoRequest = objectMapper.readValue(productoJson, ProductoRequestV.class);
        Product updatedProduct = convertirAEntidadF(productoRequest);

        // Actualizar el producto
        Product updatedEntity = productService.actualizarProducto(id, updatedProduct);
        return ResponseEntity.ok(updatedEntity);
    }


    @Transactional
    @PutMapping(path = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<Product> actualizarProducto(
            @PathVariable Long id,
            @RequestPart("producto") String productoJson,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws JsonProcessingException {
        ProductoRequest productoRequest = objectMapper.readValue(productoJson, ProductoRequest.class);
        Product updatedProduct = convertirAEntidad(productoRequest);

        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (file != null) {
            // Manejo de imagen existente
            List<Image> existingImages = imageRepository.findByEquipment(id);
            for (Image image : existingImages) {
                storageService.delete(image.getName());
                imageRepository.delete(image);
            }

            // Guardar nueva imagen
            String path = storageService.Store(file);
            Image newImage = new Image();
            newImage.setEquipment(id);
            newImage.setName(path);
            newImage.setDate(formatDate(LocalDate.now()));
            newImage.setHour(formatTime(LocalTime.now()));
            imageRepository.save(newImage);

            updatedProduct.setImage(newImage);
        } else {
            // Mantener la imagen existente si no se proporciona un nuevo archivo
            updatedProduct.setImage(existingProduct.getImage());
        }

        // Actualizar el producto
        Product updatedEntity = productService.actualizarProducto(id, updatedProduct);
        return ResponseEntity.ok(updatedEntity);
    }

    private String formatDate(LocalDate date) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM-dd-yy");
        return date.format(dateFormatter);
    }

    private String formatTime(LocalTime time) {
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");
        return time.format(timeFormatter);
    }

    }





