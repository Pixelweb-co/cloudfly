package com.app.starter1.persistence.services;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.Order;
import com.app.starter1.persistence.entity.OrderItem;
import com.app.starter1.persistence.entity.Product;
import com.app.starter1.persistence.entity.Contact;
import com.app.starter1.persistence.repository.OrderRepository;
import com.app.starter1.persistence.repository.ProductRepository;
import com.app.starter1.persistence.repository.ContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final ContactRepository contactRepository;

    public OrderService(OrderRepository orderRepository,
            ProductRepository productRepository,
            ProductService productService,
            ContactRepository contactRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.productService = productService;
        this.contactRepository = contactRepository;
    }

    /* ------------------------------ Crear Orden ------------------------------ */

    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO dto) {
        // 1. Validar que tenga tenantId
        if (dto.getTenantId() == null) {
            throw new IllegalArgumentException("El tenantId es obligatorio");
        }

        // 2. Validar que tenga items
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La orden debe tener al menos un item");
        }

        // 3. Validar customerId si está presente
        if (dto.getCustomerId() != null) {
            Contact customer = contactRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new NoSuchElementException(
                            "Cliente no encontrado con id " + dto.getCustomerId()));

            // Validar que el cliente pertenezca al tenant
            if (customer.getTenantId().longValue() != dto.getTenantId().longValue()) {
                throw new IllegalArgumentException(
                        "El cliente no pertenece al tenant " + dto.getTenantId());
            }
        }

        // 4. Validar método de pago
        if (dto.getPaymentMethod() == null || dto.getPaymentMethod().trim().isEmpty()) {
            throw new IllegalArgumentException("El método de pago es obligatorio");
        }

        // 5. Validar cada item antes de procesar
        for (OrderItemRequestDTO itemDto : dto.getItems()) {
            // Validar cantidad positiva
            if (itemDto.getQuantity() == null || itemDto.getQuantity() <= 0) {
                throw new IllegalArgumentException(
                        "La cantidad debe ser mayor a 0 para el producto " + itemDto.getProductId());
            }

            // Validar que el producto existe
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new NoSuchElementException(
                            "Producto no encontrado con id " + itemDto.getProductId()));

            // Validar que el producto pertenezca al tenant
            if (!product.getTenantId().equals(dto.getTenantId())) {
                throw new IllegalArgumentException(
                        "El producto " + product.getProductName() + " no pertenece al tenant " + dto.getTenantId());
            }

            // Validar stock disponible
            if (!productService.validateStock(itemDto.getProductId(), itemDto.getQuantity())) {
                String stockInfo = product.getManageStock() && product.getInventoryQty() != null
                        ? " (disponible: " + product.getInventoryQty() + ")"
                        : "";
                throw new IllegalStateException(
                        "Stock insuficiente para el producto: " + product.getProductName() + stockInfo);
            }

            // Validar descuento (no puede ser negativo ni mayor al precio total)
            if (itemDto.getDiscount() != null && itemDto.getDiscount().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "El descuento no puede ser negativo para el producto " + product.getProductName());
            }

            BigDecimal price = product.getSalePrice() != null ? product.getSalePrice() : product.getPrice();
            BigDecimal totalPrice = price.multiply(BigDecimal.valueOf(itemDto.getQuantity()));

            if (itemDto.getDiscount() != null && itemDto.getDiscount().compareTo(totalPrice) > 0) {
                throw new IllegalArgumentException(
                        "El descuento no puede ser mayor al precio total del producto " + product.getProductName());
            }
        }

        // 6. Validar descuento y tax a nivel de orden
        if (dto.getDiscount() != null && dto.getDiscount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El descuento de la orden no puede ser negativo");
        }

        if (dto.getTax() != null && dto.getTax().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El impuesto no puede ser negativo");
        }

        // 7. Crear la orden (todas las validaciones pasaron)
        Order order = Order.builder()
                .tenantId(dto.getTenantId())
                .customerId(dto.getCustomerId())
                .invoiceNumber(generateInvoiceNumber(dto.getTenantId()))
                .tax(dto.getTax() != null ? dto.getTax() : BigDecimal.ZERO)
                .discount(dto.getDiscount() != null ? dto.getDiscount() : BigDecimal.ZERO)
                .paymentMethod(dto.getPaymentMethod())
                .status("COMPLETED")
                .createdBy(dto.getCreatedBy())
                .build();

        // 8. Procesar cada item y reducir stock
        for (OrderItemRequestDTO itemDto : dto.getItems()) {
            // Obtener el producto (ya validado antes)
            Product product = productRepository.findById(itemDto.getProductId()).get();

            // Crear item de orden (snapshot del producto)
            BigDecimal price = product.getSalePrice() != null ? product.getSalePrice() : product.getPrice();

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getProductName())
                    .sku(product.getSku())
                    .barcode(product.getBarcode())
                    .unitPrice(price)
                    .quantity(itemDto.getQuantity())
                    .discount(itemDto.getDiscount() != null ? itemDto.getDiscount() : BigDecimal.ZERO)
                    .build();

            // Calcular subtotal del item
            orderItem.calculateSubtotal();

            // Agregar item a la orden
            order.addItem(orderItem);

            // Reducir stock
            productService.reduceStock(itemDto.getProductId(), itemDto.getQuantity());
        }

        // 9. Calcular total de la orden
        order.calculateTotal();

        // 10. Guardar
        Order savedOrder = orderRepository.save(order);

        return toResponseDTO(savedOrder);
    }

    /*
     * ------------------------------ Obtener Orden por ID
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Orden no encontrada con id " + id));

        return toResponseDTO(order);
    }

    /*
     * ------------------------------ Listar Órdenes por Tenant
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrdersByTenant(Long tenantId) {
        List<Order> orders = orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);

        return orders.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /*
     * ------------------------------ Buscar por Número de Factura
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderByInvoiceNumber(String invoiceNumber) {
        Order order = orderRepository.findByInvoiceNumber(invoiceNumber)
                .orElseThrow(
                        () -> new NoSuchElementException("Orden no encontrada con número de factura " + invoiceNumber));

        return toResponseDTO(order);
    }

    /*
     * ------------------------------ Listar Órdenes por Rango de Fechas
     * ------------------------------
     */

    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrdersByDateRange(Long tenantId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findByTenantIdAndDateRange(tenantId, startDateTime, endDateTime);

        return orders.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    /*
     * ------------------------------ Cancelar Orden ------------------------------
     */

    @Transactional
    public OrderResponseDTO cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Orden no encontrada con id " + id));

        if ("CANCELLED".equals(order.getStatus())) {
            throw new IllegalStateException("La orden ya está cancelada");
        }

        // Restaurar stock de todos los items
        for (OrderItem item : order.getItems()) {
            productService.restoreStock(item.getProduct().getId(), item.getQuantity());
        }

        // Cambiar estado
        order.setStatus("CANCELLED");
        Order savedOrder = orderRepository.save(order);

        return toResponseDTO(savedOrder);
    }

    /*
     * ------------------------------ Generador de Invoice Number
     * ------------------------------
     */

    private String generateInvoiceNumber(Long tenantId) {
        // Formato: INV-{tenantId}-{YYYYMMDD}-{secuencia}
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // Obtener el último ID para este tenant
        Long maxId = orderRepository.findMaxIdByTenantId(tenantId);
        long sequence = (maxId != null ? maxId : 0) + 1;

        String invoiceNumber = String.format("INV-%d-%s-%05d", tenantId, dateStr, sequence);

        // Verificar que no exista (por seguridad)
        int attempts = 0;
        while (orderRepository.existsByInvoiceNumber(invoiceNumber) && attempts < 100) {
            sequence++;
            invoiceNumber = String.format("INV-%d-%s-%05d", tenantId, dateStr, sequence);
            attempts++;
        }

        if (attempts >= 100) {
            throw new IllegalStateException("No se pudo generar un número de factura único");
        }

        return invoiceNumber;
    }

    /* ------------------------------ Mapper ------------------------------ */

    private OrderResponseDTO toResponseDTO(Order order) {
        List<OrderItemResponseDTO> itemDTOs = order.getItems().stream()
                .map(this::toItemResponseDTO)
                .collect(Collectors.toList());

        return OrderResponseDTO.builder()
                .id(order.getId())
                .tenantId(order.getTenantId())
                .customerId(order.getCustomerId())
                .invoiceNumber(order.getInvoiceNumber())
                .subtotal(order.getSubtotal())
                .tax(order.getTax())
                .discount(order.getDiscount())
                .total(order.getTotal())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .createdBy(order.getCreatedBy())
                .items(itemDTOs)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemResponseDTO toItemResponseDTO(OrderItem item) {
        return OrderItemResponseDTO.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .sku(item.getSku())
                .barcode(item.getBarcode())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .discount(item.getDiscount())
                .subtotal(item.getSubtotal())
                .total(item.getTotal())
                .build();
    }
}
