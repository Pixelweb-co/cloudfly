package com.app.persistence.repository;

import com.app.persistence.entity.ContactEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactRepository extends ReactiveCrudRepository<ContactEntity, Long> {
}
