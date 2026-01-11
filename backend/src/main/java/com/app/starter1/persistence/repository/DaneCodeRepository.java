package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.DaneCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DaneCodeRepository extends JpaRepository<DaneCode, Long> {

    /**
     * Buscar por código DANE
     */
    Optional<DaneCode> findByCodigo(String codigo);

    /**
     * Buscar todos los departamentos
     */
    List<DaneCode> findByTipoAndActivoOrderByNombreAsc(DaneCode.TipoDane tipo, Boolean activo);

    /**
     * Buscar ciudades de un departamento específico
     */
    List<DaneCode> findByTipoAndCodigoDepartamentoAndActivoOrderByNombreAsc(
            DaneCode.TipoDane tipo,
            String codigoDepartamento,
            Boolean activo);

    /**
     * Buscar todos activos por tipo
     */
    List<DaneCode> findByActivoTrueOrderByNombreAsc();

    /**
     * Verificar si existe un código
     */
    boolean existsByCodigo(String codigo);
}
