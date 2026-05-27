package com.app.persistence.repository;

import com.app.persistence.entity.QuoteItemEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface QuoteItemRepository extends ReactiveCrudRepository<QuoteItemEntity, Long> {
    @Query("SELECT * FROM quote_items WHERE quote_id = :quoteId")
    Flux<QuoteItemEntity> findByQuoteId(Long quoteId);

    @Query("DELETE FROM quote_items WHERE quote_id = :quoteId")
    Mono<Void> deleteByQuoteId(Long quoteId);
}
