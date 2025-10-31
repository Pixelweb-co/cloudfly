package com.app.starter1.persistence.repository;

import com.app.starter1.dto.SolicitudDTO;
import com.app.starter1.persistence.entity.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {

    @Query(value = """
        SELECT * 
        FROM solicitudes s
        INNER JOIN users u ON u.id = s.id_usuario_asignado
        INNER JOIN tipo_servicio t ON t.id_tipo_servicio = s.id_tipo_servicio
        INNER JOIN estado_solicitud es ON es.id_estado_sol = s.status
        INNER JOIN products p ON p.id_producto = s.id_equipo
        INNER JOIN customers c ON c.id = s.id_entidad
        ORDER BY s.id_solicitud DESC
        LIMIT 0, 10
    """, nativeQuery = true)
    List<SolicitudDTO> findAllSolicitudes();

    // Encontrar solicitudes abiertas por el id del usuario asignado
    List<Solicitud> findByUsuarioAsignadoIdAndStatusDescripcion(Long idUsuario, String estado);

    // Método para obtener las solicitudes del usuario asignado con estado "ABIERTO" y fecha de hoy
    List<Solicitud> findByUsuarioAsignadoIdAndStatusDescripcionAndFecha(Long usuarioId, String estado, String fecha);

    @Query("SELECT s FROM Solicitud s WHERE s.equipo.id = :productId AND s.status.id = 3")
    List<Solicitud> findClosedRequestsByProductId(@Param("productId") Long productId);

    long countByEquipoId(Long equipoId);

    // Conteo por mes del año especificado (asumiendo s.fecha formato 'YYYY-MM-DD' o 'YYYY/MM/DD' o 'YYYYMMDD')
    @Query(value = """
        SELECT MONTH(STR_TO_DATE(s.fecha, '%Y-%m-%d')) AS month, COUNT(*) AS total
        FROM solicitudes s
        WHERE YEAR(STR_TO_DATE(s.fecha, '%Y-%m-%d')) = :year
        GROUP BY MONTH(STR_TO_DATE(s.fecha, '%Y-%m-%d'))
        ORDER BY month
    """, nativeQuery = true)
    List<MonthlyCount> countByMonth(@Param("year") int year);

    @Query(value = """
        SELECT es.desc_estado_sol AS status, COUNT(*) AS total
        FROM solicitudes s
        JOIN estado_solicitud es ON es.id_estado_sol = s.status
        WHERE YEAR(STR_TO_DATE(s.fecha, '%Y-%m-%d')) = :year
          AND MONTH(STR_TO_DATE(s.fecha, '%Y-%m-%d')) = :month
        GROUP BY es.desc_estado_sol
    """, nativeQuery = true)
    List<StatusCount> countByStatusInMonth(@Param("year") int year, @Param("month") int month);
}
