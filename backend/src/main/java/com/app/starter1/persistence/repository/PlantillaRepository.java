package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Plantilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantillaRepository extends JpaRepository<Plantilla, Long> {

    List<Plantilla> findByMarcaAndModeloAndTipoElement(String marca, String modelo, Long tipoElement);

    void deleteByMarcaAndModeloAndTipoElement(String marca, String modelo, Long tipoElement);


    @Query("SELECT p FROM Plantilla p " +
            "WHERE p.tipoElement = (SELECT pr.productType FROM Product pr WHERE pr.id = :idProducto)" +
            "AND p.marca = (SELECT pr.brand FROM Product pr WHERE pr.id = :idProducto)" +
            "AND p.modelo = (SELECT pr.model FROM Product pr WHERE pr.id = :idProducto)")
    List<Plantilla> findPlantillasByProductoId(@Param("idProducto") Long idProducto);



}


