package com.app.persistence.repository;

import com.app.persistence.entity.OrderItemEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface OrderItemRepository extends ReactiveCrudRepository<OrderItemEntity, Long> {
    @Query("SELECT * FROM order_items WHERE order_id = :orderId")
    Flux<OrderItemEntity> findByOrderId(Long orderId);

    @Query("DELETE FROM order_items WHERE order_id = :orderId")
    Mono<Void> deleteByOrderId(Long orderId);
}
