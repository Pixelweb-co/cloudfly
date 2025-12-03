package com.app.starter1.controllers;

import com.app.starter1.dto.OrderRequestDTO;
import com.app.starter1.dto.OrderResponseDTO;
import com.app.starter1.persistence.services.OrderService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Crear nueva orden desde POS
     */
    @PostMapping
    public ResponseEntity<OrderResponseDTO> createOrder(@Valid @RequestBody OrderRequestDTO request) {
        OrderResponseDTO response = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Obtener orden por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long id) {
        OrderResponseDTO response = orderService.getOrderById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Listar todas las órdenes de un tenant
     */
    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByTenant(@PathVariable Long tenantId) {
        List<OrderResponseDTO> orders = orderService.getOrdersByTenant(tenantId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Buscar orden por número de factura
     */
    @GetMapping("/invoice/{invoiceNumber}")
    public ResponseEntity<OrderResponseDTO> getOrderByInvoiceNumber(@PathVariable String invoiceNumber) {
        OrderResponseDTO response = orderService.getOrderByInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok(response);
    }

    /**
     * Obtener órdenes por rango de fechas
     */
    @GetMapping("/tenant/{tenantId}/by-date")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByDateRange(
            @PathVariable Long tenantId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<OrderResponseDTO> orders = orderService.getOrdersByDateRange(tenantId, startDate, endDate);
        return ResponseEntity.ok(orders);
    }

    /**
     * Cancelar orden (restaura inventario)
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponseDTO> cancelOrder(@PathVariable Long id) {
        OrderResponseDTO response = orderService.cancelOrder(id);
        return ResponseEntity.ok(response);
    }
}
