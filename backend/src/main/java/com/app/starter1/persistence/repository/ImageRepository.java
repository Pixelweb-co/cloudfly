package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    @Query("SELECT i FROM Image i WHERE i.equipment = :equipmentId")
    List<Image> findByEquipment(@Param("equipmentId") Long equipmentId);

}
