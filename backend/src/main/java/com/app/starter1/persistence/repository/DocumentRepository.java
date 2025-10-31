package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Document;
import com.app.starter1.persistence.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByEquipment(Long productId);
    Document findByName(String name);
}
