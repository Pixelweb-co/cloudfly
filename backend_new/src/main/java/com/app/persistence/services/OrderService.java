package com.app.persistence.services;

import com.app.dto.OrderRequestDTO;
import com.app.dto.OrderResponseDTO;
import com.app.persistence.entity.OrderEntity;
import com.app.persistence.entity.OrderItemEntity;
import com.app.persistence.entity.OrderStatus;
import com.app.persistence.repository.ContactRepository;
import com.app.persistence.repository.ProductRepository;
import com.app.persistence.repository.OrderItemRepository;
import com.app.persistence.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ContactRepository contactRepository;

    public Flux<OrderResponseDTO> listByTenant(Long tenantId, Long companyId) {
        Flux<OrderEntity> orders;
        if (companyId != null) {
            orders = orderRepository.findAllByTenantIdAndCompanyId(tenantId, companyId);
        } else {
            orders = orderRepository.findAllByTenantId(tenantId);
        }
        return orders.flatMap(this::enrichWithItemsAndCustomer);
    }

    public Mono<OrderResponseDTO> getById(Long id) {
        return orderRepository.findById(id)
                .flatMap(this::enrichWithItemsAndCustomer);
    }

    @Transactional
    public Mono<OrderResponseDTO> createOrder(OrderRequestDTO request) {
        log.info("🚀 [ORDER-SERVICE] Creating order for Tenant: {}, Company: {}", request.getTenantId(),
                request.getCompanyId());

        OrderEntity order = OrderEntity.builder()
                .tenantId(request.getTenantId())
                .companyId(request.getCompanyId())
                .customerId(request.getCustomerId())
                .customerName(request.getCustomerName())
                .orderDate(LocalDateTime.now())
                .expirationDate(request.getExpirationDate())
                .status(request.getStatus() != null ? request.getStatus() : OrderStatus.PROCESANDO)
                .notes(request.getNotes())
                .terms(request.getTerms())
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .subtotal(request.getSubtotal() != null ? request.getSubtotal() : BigDecimal.ZERO)
                .tax(request.getTax() != null ? request.getTax() : BigDecimal.ZERO)
                .discount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO)
                .total(request.getTotal() != null ? request.getTotal() : BigDecimal.ZERO)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return orderRepository.save(order)
                .flatMap(savedOrder -> {
                    if (request.getItems() == null || request.getItems().isEmpty()) {
                        return Mono.just(savedOrder).flatMap(o -> enrichWithItemsAndCustomer(o));
                    }

                    List<OrderItemEntity> items = request.getItems().stream()
                            .map(itemReq -> {
                                OrderItemEntity item = new OrderItemEntity();
                                item.setOrderId(savedOrder.getId());
                                item.setProductId(itemReq.getProductId());
                                item.setProductName(itemReq.getProductName());
                                item.setQuantity(itemReq.getQuantity());
                                item.setUnitPrice(itemReq.getUnitPrice());
                                item.setDiscount(
                                        itemReq.getDiscount() != null ? itemReq.getDiscount() : BigDecimal.ZERO);
                                item.setSubtotal(itemReq.getSubtotal());
                                // Calculate tax and total for items if needed or use from request
                                item.setTax(BigDecimal.ZERO); // Default or logic
                                item.setTotal(itemReq.getSubtotal()); // Simplified
                                item.setTenantId(savedOrder.getTenantId());
                                return item;
                            }).collect(Collectors.toList());

                    return orderItemRepository.saveAll(items)
                            .collectList()
                            .then(Mono.just(savedOrder))
                            .flatMap(this::enrichWithItemsAndCustomer);
                });
    }

    @Transactional
    public Mono<OrderResponseDTO> updateOrder(Long id, OrderRequestDTO request) {
        return orderRepository.findById(id)
                .flatMap(existingOrder -> {
                    existingOrder.setCustomerId(request.getCustomerId());
                    existingOrder.setCustomerName(request.getCustomerName());
                    existingOrder.setNotes(request.getNotes());
                    existingOrder.setTerms(request.getTerms());
                    existingOrder.setExpirationDate(request.getExpirationDate());
                    existingOrder.setStatus(request.getStatus());
                    existingOrder.setUpdatedAt(LocalDateTime.now());

                    // Recalculate based on input if necessary, but here we trust the DTO for now
                    existingOrder.setSubtotal(request.getSubtotal());
                    existingOrder.setTax(request.getTax());
                    existingOrder.setDiscount(request.getDiscount());
                    existingOrder.setTotal(request.getTotal());

                    return orderItemRepository.deleteByOrderId(id)
                            .thenMany(Flux.fromIterable(request.getItems()))
                            .map(itemReq -> {
                                OrderItemEntity item = new OrderItemEntity();
                                item.setOrderId(id);
                                item.setProductId(itemReq.getProductId());
                                item.setProductName(itemReq.getProductName());
                                item.setQuantity(itemReq.getQuantity());
                                item.setUnitPrice(itemReq.getUnitPrice());
                                item.setDiscount(itemReq.getDiscount());
                                item.setSubtotal(itemReq.getSubtotal());
                                item.setTenantId(existingOrder.getTenantId());
                                item.setTax(BigDecimal.ZERO);
                                item.setTotal(itemReq.getSubtotal());
                                return item;
                            })
                            .collectList()
                            .flatMap(newItems -> orderItemRepository.saveAll(newItems).collectList())
                            .then(orderRepository.save(existingOrder))
                            .flatMap(this::enrichWithItemsAndCustomer);
                });
    }

    @Transactional
    public Mono<Void> deleteOrder(Long id) {
        return orderItemRepository.deleteByOrderId(id)
                .then(orderRepository.deleteById(id));
    }

    private Mono<OrderResponseDTO> enrichWithItemsAndCustomer(OrderEntity order) {
        return orderItemRepository.findByOrderId(order.getId())
                .collectList()
                .flatMap(items -> {
                    OrderResponseDTO dto = mapToDTO(order);
                    dto.setItems(items.stream().map(this::mapItemToDTO).collect(Collectors.toList()));

                    if (order.getCustomerId() != null
                            && (order.getCustomerName() == null || order.getCustomerName().isEmpty())) {
                        return contactRepository.findById(order.getCustomerId())
                                .map(contact -> {
                                    dto.setCustomerName(contact.getName());
                                    return dto;
                                })
                                .defaultIfEmpty(dto);
                    }
                    return Mono.just(dto);
                });
    }

    private OrderResponseDTO mapToDTO(OrderEntity order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setTenantId(order.getTenantId());
        dto.setCompanyId(order.getCompanyId());
        dto.setCustomerId(order.getCustomerId());
        dto.setCustomerName(order.getCustomerName());
        dto.setOrderNumber(order.getOrderNumber());
        dto.setOrderDate(order.getOrderDate());
        dto.setExpirationDate(order.getExpirationDate());
        dto.setStatus(order.getStatus());
        dto.setSubtotal(order.getSubtotal());
        dto.setTax(order.getTax());
        dto.setDiscount(order.getDiscount());
        dto.setTotal(order.getTotal());
        dto.setNotes(order.getNotes());
        dto.setTerms(order.getTerms());
        return dto;
    }

    private OrderResponseDTO.OrderItemResponseDTO mapItemToDTO(OrderItemEntity item) {
        OrderResponseDTO.OrderItemResponseDTO itemDTO = new OrderResponseDTO.OrderItemResponseDTO();
        itemDTO.setId(item.getId());
        itemDTO.setProductId(item.getProductId());
        itemDTO.setProductName(item.getProductName());
        itemDTO.setQuantity(item.getQuantity());
        itemDTO.setUnitPrice(item.getUnitPrice());
        itemDTO.setDiscount(item.getDiscount());
        itemDTO.setSubtotal(item.getSubtotal());
        itemDTO.setTotal(item.getTotal());
        return itemDTO;
    }
}
